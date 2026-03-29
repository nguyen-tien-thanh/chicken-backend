import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InventoryLedgerService } from '../inventory-transaction/inventory-ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './sale.dto';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedgerService,
  ) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  /** Cập nhật subtotal / final / remaining từ các dòng chi tiết và giảm giá / đã thu hiện có trên đơn. */
  async recalcSaleTotals(saleId: string, tx?: DbClient) {
    const db = this.client(tx);
    const sale = await db.sale.findFirst({
      where: { id: saleId, deletedAt: null },
    });
    if (!sale) return;

    const agg = await db.saleItem.aggregate({
      where: { saleId, deletedAt: null },
      _sum: { amount: true },
    });
    const subtotalAmount = agg._sum.amount ?? 0;
    const finalAmount = subtotalAmount - sale.discountAmount;
    const remainingAmount = finalAmount - sale.paidAmount;

    await db.sale.update({
      where: { id: saleId },
      data: { subtotalAmount, finalAmount, remainingAmount },
    });
  }

  async create(dto: CreateSaleDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
    }

    const discountAmount = dto.discountAmount ?? 0;
    const paidAmount = dto.paidAmount ?? 0;

    const itemsData = dto.items.map((item) => {
      const amount = item.amount ?? item.quantity * item.unitPrice;
      const costAmount = item.costAmount ?? 0;
      const profitAmount = amount - costAmount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        unitPrice: item.unitPrice,
        amount,
        costAmount,
        profitAmount,
        note: item.note,
      };
    });

    const subtotalAmount = itemsData.reduce((s, i) => s + i.amount, 0);
    const finalAmount = subtotalAmount - discountAmount;
    const remainingAmount = finalAmount - paidAmount;

    return this.prisma.$transaction(async (tx) => {
      await this.ledger.assertSaleLinesAvailable(
        itemsData.map((i) => ({
          productId: i.productId,
          quantityUnit: i.quantityUnit,
          quantity: i.quantity,
        })),
      );

      const created = await tx.sale.create({
        data: {
          saleDate: dto.saleDate,
          customerId: dto.customerId,
          note: dto.note,
          subtotalAmount,
          discountAmount,
          finalAmount,
          paidAmount,
          remainingAmount,
          status: dto.status ?? 'PENDING',
          saleItems: { create: itemsData },
        },
        include: { saleItems: true, customer: true },
      });

      for (const si of created.saleItems) {
        await this.ledger.syncSaleLineOut(si, dto.saleDate, dto.note);
      }

      return created;
    });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.sale.findMany({
        orderBy: { saleDate: 'desc' },
        where: { deletedAt: null },
        ...query,
      }),
      this.prisma.sale.count({
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
    const row = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      ...query,
    });
    if (!row) {
      throw new NotFoundException('Đơn bán hàng không tồn tại');
    }
    return row;
  }

  async update(id: string, dto: UpdateSaleDto) {
    const existing = await this.findOne(id);
    const data: Prisma.SaleUpdateInput = {};

    if (dto.saleDate !== undefined) {
      data.saleDate = dto.saleDate;
    }
    if (dto.customerId !== undefined) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, deletedAt: null },
      });
      if (!customer) {
        throw new NotFoundException('Khách hàng không tồn tại');
      }
      data.customer = { connect: { id: dto.customerId } };
    }
    if (dto.note !== undefined) {
      data.note = dto.note;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    const discountAmount =
      dto.discountAmount !== undefined
        ? dto.discountAmount
        : existing.discountAmount;
    const paidAmount =
      dto.paidAmount !== undefined ? dto.paidAmount : existing.paidAmount;

    if (dto.discountAmount !== undefined || dto.paidAmount !== undefined) {
      data.discountAmount = discountAmount;
      data.paidAmount = paidAmount;
      const subtotal = existing.subtotalAmount;
      data.finalAmount = subtotal - discountAmount;
      data.remainingAmount = subtotal - discountAmount - paidAmount;
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.sale.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await this.ledger.removeSaleInventoryForSale(id);
      return tx.sale.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
