import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { InventoryLedgerService } from '../inventory-transaction/inventory-ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedgerService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, deletedAt: null },
    });
    if (!supplier) {
      throw new NotFoundException('Nhà cung cấp không tồn tại');
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
    }

    const itemsData = dto.items.map((item) => {
      const amount = item.amount ?? item.quantity * item.unitPrice;
      return {
        productId: item.productId,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        unitPrice: item.unitPrice,
        amount,
        note: item.note,
      };
    });
    const totalAmount = itemsData.reduce((s, i) => s + i.amount, 0);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          purchaseDate: dto.purchaseDate,
          cagesCount: dto.cagesCount,
          cagesWeight: dto.cagesWeight,
          averageWeight: dto.averageWeight,
          supplierId: dto.supplierId,
          note: dto.note,
          totalAmount,
          purchaseItems: { create: itemsData },
        },
        include: { purchaseItems: true, supplier: true },
      });
      for (const pi of created.purchaseItems) {
        await this.ledger.syncPurchaseLineIn(pi, dto.purchaseDate, dto.note);
      }
      return created;
    });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.purchase.findMany({
        orderBy: { purchaseDate: 'desc' },
        where: { deletedAt: null },
        ...query,
      }),
      this.prisma.purchase.count({
        where: { deletedAt: null, ...query.where },
      }),
    ]);
    return new Pagination({
      results: rows,
      currentPage: skip,
      pageSize: take,
      totalItems: total,
      next: skip < Math.ceil(total / take) ? skip + 1 : undefined,
      previous: skip > 1 ? skip - 1 : undefined,
    });
  }

  async findOne(id: string, query: IQueryOne = {}) {
    const row = await this.prisma.purchase.findUnique({
      where: { id },
      ...query,
    });
    if (!row) {
      throw new NotFoundException('Đơn nhập hàng không tồn tại');
    }
    return row;
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    const existing = await this.findOne(id, {
      include: { purchaseItems: { where: { deletedAt: null } } },
    });

    return this.prisma.$transaction(async (tx) => {
      // --- update header fields ---
      const data: Prisma.PurchaseUpdateInput = {};
      if (dto.purchaseDate !== undefined) data.purchaseDate = dto.purchaseDate;
      if (dto.note !== undefined) data.note = dto.note;
      if (dto.cagesCount !== undefined) data.cagesCount = dto.cagesCount;
      if (dto.cagesWeight !== undefined) data.cagesWeight = dto.cagesWeight;
      if (dto.averageWeight !== undefined)
        data.averageWeight = dto.averageWeight;
      if (dto.supplierId !== undefined) {
        const supplier = await this.prisma.supplier.findFirst({
          where: { id: dto.supplierId, deletedAt: null },
        });
        if (!supplier)
          throw new NotFoundException('Nhà cung cấp không tồn tại');
        data.supplier = { connect: { id: dto.supplierId } };
      }

      // --- update items ---
      if (dto.items !== undefined) {
        const productIds = [...new Set(dto.items.map((i) => i.productId))];
        const products = await this.prisma.product.findMany({
          where: { id: { in: productIds }, deletedAt: null },
        });
        if (products.length !== productIds.length) {
          throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
        }

        const purchaseDate = dto.purchaseDate ?? (existing as any).purchaseDate;
        const note = dto.note !== undefined ? dto.note : (existing as any).note;

        const incomingIds = new Set(
          dto.items.filter((i) => i.id).map((i) => i.id!),
        );
        const existingItems: Array<{ id: string }> =
          (existing as any).purchaseItems ?? [];

        // soft-delete items not in incoming list
        const toDelete = existingItems.filter((ei) => !incomingIds.has(ei.id));
        for (const ei of toDelete) {
          await this.ledger.removeByRef(
            InventoryTransactionType.PURCHASE,
            ei.id,
          );
          await tx.purchaseItem.update({
            where: { id: ei.id },
            data: { deletedAt: new Date() },
          });
        }

        const savedItems: Array<{
          id: string;
          productId: string;
          quantity: number;
          quantityUnit: string;
          unitPrice: number;
          amount: number;
          note?: string | null;
        }> = [];

        for (const item of dto.items) {
          const amount = item.amount ?? item.quantity * item.unitPrice;
          const itemData = {
            productId: item.productId,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit,
            unitPrice: item.unitPrice,
            amount,
            note: item.note,
          };

          if (item.id) {
            const updated = await tx.purchaseItem.update({
              where: { id: item.id },
              data: itemData,
            });
            savedItems.push(updated);
          } else {
            const created = await tx.purchaseItem.create({
              data: { purchaseId: id, ...itemData },
            });
            savedItems.push(created);
          }
        }

        // sync ledger for all updated/created items
        for (const pi of savedItems) {
          await this.ledger.syncPurchaseLineIn(pi, purchaseDate, note);
        }

        // recalc totalAmount
        const totalAmount = savedItems.reduce((s, i) => s + i.amount, 0);
        data.totalAmount = totalAmount;
      }

      if (Object.keys(data).length === 0) {
        return this.findOne(id);
      }
      return tx.purchase.update({
        where: { id },
        data,
        include: {
          purchaseItems: { where: { deletedAt: null } },
          supplier: true,
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await this.ledger.removePurchaseInventoryForPurchase(id);
      return tx.purchase.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
