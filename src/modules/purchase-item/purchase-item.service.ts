import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { InventoryLedgerService } from '../inventory-transaction/inventory-ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseItemDto,
  UpdatePurchaseItemDto,
} from './purchase-item.dto';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PurchaseItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedgerService,
  ) {}

  private async recalcPurchaseTotal(tx: DbClient, purchaseId: string) {
    const agg = await tx.purchaseItem.aggregate({
      where: { purchaseId, deletedAt: null },
      _sum: { amount: true },
    });
    await tx.purchase.update({
      where: { id: purchaseId },
      data: { totalAmount: agg._sum.amount ?? 0 },
    });
  }

  async create(dto: CreatePurchaseItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id: dto.purchaseId, deletedAt: null },
      });
      if (!purchase) {
        throw new NotFoundException('Đơn nhập hàng không tồn tại');
      }
      const product = await tx.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
      });
      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      const amount = dto.amount ?? dto.quantity * dto.unitPrice;
      const row = await tx.purchaseItem.create({
        data: {
          purchaseId: dto.purchaseId,
          productId: dto.productId,
          quantity: dto.quantity,
          quantityUnit: dto.quantityUnit,
          unitPrice: dto.unitPrice,
          amount,
          note: dto.note,
        },
      });

      await this.ledger.syncPurchaseLineIn(
        row,
        purchase.purchaseDate,
        purchase.note,
      );
      await this.recalcPurchaseTotal(tx, dto.purchaseId);
      return row;
    });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.purchaseItem.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
        where: { deletedAt: null, ...query.where },
      }),
      this.prisma.purchaseItem.count({
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
    const row = await this.prisma.purchaseItem.findUnique({
      where: { id },
      ...query,
    });
    if (!row) {
      throw new NotFoundException('Dòng đơn nhập không tồn tại');
    }
    return row;
  }

  async update(id: string, dto: UpdatePurchaseItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseItem.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException('Dòng đơn nhập không tồn tại');
      }
      if (dto.purchaseId !== undefined) {
        const p = await tx.purchase.findFirst({
          where: { id: dto.purchaseId, deletedAt: null },
        });
        if (!p) {
          throw new NotFoundException('Đơn nhập hàng không tồn tại');
        }
      }
      if (dto.productId !== undefined) {
        const product = await tx.product.findFirst({
          where: { id: dto.productId, deletedAt: null },
        });
        if (!product) {
          throw new NotFoundException('Sản phẩm không tồn tại');
        }
      }

      const quantity = dto.quantity ?? existing.quantity;
      const unitPrice = dto.unitPrice ?? existing.unitPrice;
      const amount =
        dto.amount !== undefined ? dto.amount : quantity * unitPrice;

      const row = await tx.purchaseItem.update({
        where: { id },
        data: {
          ...(dto.purchaseId !== undefined && { purchaseId: dto.purchaseId }),
          ...(dto.productId !== undefined && { productId: dto.productId }),
          ...(dto.quantity !== undefined && { quantity: dto.quantity }),
          ...(dto.quantityUnit !== undefined && {
            quantityUnit: dto.quantityUnit,
          }),
          ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
          amount,
          ...(dto.note !== undefined && { note: dto.note }),
        },
      });

      const purchase = await tx.purchase.findFirst({
        where: { id: row.purchaseId, deletedAt: null },
      });
      if (!purchase) {
        throw new NotFoundException('Đơn nhập hàng không tồn tại');
      }
      await this.ledger.syncPurchaseLineIn(
        row,
        purchase.purchaseDate,
        purchase.note,
      );

      await this.recalcPurchaseTotal(tx, existing.purchaseId);
      if (
        dto.purchaseId !== undefined &&
        dto.purchaseId !== existing.purchaseId
      ) {
        await this.recalcPurchaseTotal(tx, dto.purchaseId);
      }
      return row;
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.purchaseItem.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        throw new NotFoundException('Dòng đơn nhập không tồn tại');
      }
      const purchaseId = row.purchaseId;
      await this.ledger.removeByRef(InventoryTransactionType.PURCHASE, id);
      const updated = await tx.purchaseItem.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.recalcPurchaseTotal(tx, purchaseId);
      return updated;
    });
  }
}
