import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { InventoryLedgerService } from '../inventory-transaction/inventory-ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaleService } from '../sale/sale.service';
import { CreateSaleItemDto, UpdateSaleItemDto } from './sale-item.dto';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SaleItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saleService: SaleService,
    private readonly ledger: InventoryLedgerService,
  ) {}

  private async ensureSaleActive(saleId: string, tx?: DbClient) {
    const db = tx ?? this.prisma;
    const sale = await db.sale.findFirst({
      where: { id: saleId, deletedAt: null },
    });
    if (!sale) {
      throw new NotFoundException('Đơn bán hàng không tồn tại');
    }
    return sale;
  }

  private async ensureProductActive(productId: string, tx?: DbClient) {
    const db = tx ?? this.prisma;
    const product = await db.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
  }

  async create(dto: CreateSaleItemDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureSaleActive(dto.saleId, tx);
      await this.ensureProductActive(dto.productId, tx);

      await this.ledger.assertSaleLinesAvailable([
        {
          productId: dto.productId,
          quantityUnit: dto.quantityUnit,
          quantity: dto.quantity,
        },
      ]);

      const amount = dto.amount ?? dto.quantity * dto.unitPrice;
      const costAmount = dto.costAmount ?? 0;
      const profitAmount = amount - costAmount;

      const row = await tx.saleItem.create({
        data: {
          saleId: dto.saleId,
          productId: dto.productId,
          quantity: dto.quantity,
          quantityUnit: dto.quantityUnit,
          unitPrice: dto.unitPrice,
          amount,
          costAmount,
          profitAmount,
          note: dto.note,
        },
      });

      const sale = await this.ensureSaleActive(dto.saleId, tx);
      await this.ledger.syncSaleLineOut(row, sale.saleDate, sale.note);
      await this.saleService.recalcSaleTotals(dto.saleId, tx);
      return row;
    });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.saleItem.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
        where: { deletedAt: null, ...query.where },
      }),
      this.prisma.saleItem.count({
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
    const row = await this.prisma.saleItem.findFirst({
      where: { id, deletedAt: null },
      ...query,
    });
    if (!row) {
      throw new NotFoundException('Dòng đơn bán không tồn tại');
    }
    return row;
  }

  async update(id: string, dto: UpdateSaleItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.saleItem.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException('Dòng đơn bán không tồn tại');
      }
      if (dto.saleId !== undefined) {
        await this.ensureSaleActive(dto.saleId, tx);
      }
      if (dto.productId !== undefined) {
        await this.ensureProductActive(dto.productId, tx);
      }

      await this.ledger.removeByRef(InventoryTransactionType.SALE, id);

      const quantity = dto.quantity ?? existing.quantity;
      const unitPrice = dto.unitPrice ?? existing.unitPrice;
      const amount =
        dto.amount !== undefined ? dto.amount : quantity * unitPrice;
      const costAmount = dto.costAmount ?? existing.costAmount;
      const profitAmount = amount - costAmount;

      const productId = dto.productId ?? existing.productId;
      const quantityUnit = dto.quantityUnit ?? existing.quantityUnit;

      await this.ledger.assertSaleLinesAvailable([
        { productId, quantityUnit, quantity },
      ]);

      const row = await tx.saleItem.update({
        where: { id },
        data: {
          ...(dto.saleId !== undefined && { saleId: dto.saleId }),
          ...(dto.productId !== undefined && { productId: dto.productId }),
          ...(dto.quantity !== undefined && { quantity: dto.quantity }),
          ...(dto.quantityUnit !== undefined && {
            quantityUnit: dto.quantityUnit,
          }),
          ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
          amount,
          costAmount,
          profitAmount,
          ...(dto.note !== undefined && { note: dto.note }),
        },
      });

      const sale = await this.ensureSaleActive(row.saleId, tx);
      await this.ledger.syncSaleLineOut(row, sale.saleDate, sale.note);

      await this.saleService.recalcSaleTotals(existing.saleId, tx);
      if (dto.saleId !== undefined && dto.saleId !== existing.saleId) {
        await this.saleService.recalcSaleTotals(dto.saleId, tx);
      }
      return row;
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.saleItem.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        throw new NotFoundException('Dòng đơn bán không tồn tại');
      }
      const saleId = row.saleId;
      await this.ledger.removeByRef(InventoryTransactionType.SALE, id);
      const updated = await tx.saleItem.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.saleService.recalcSaleTotals(saleId, tx);
      return updated;
    });
  }
}
