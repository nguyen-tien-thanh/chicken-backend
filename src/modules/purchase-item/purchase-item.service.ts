import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseItemDto,
  UpdatePurchaseItemDto,
} from './purchase-item.dto';

@Injectable()
export class PurchaseItemService {
  constructor(private readonly prisma: PrismaService) {}

  private async recalcPurchaseTotal(purchaseId: string) {
    const agg = await this.prisma.purchaseItem.aggregate({
      where: { purchaseId, deletedAt: null },
      _sum: { amount: true },
    });
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { totalAmount: agg._sum.amount ?? 0 },
    });
  }

  private async ensurePurchaseActive(purchaseId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, deletedAt: null },
    });
    if (!purchase) {
      throw new NotFoundException('Đơn nhập hàng không tồn tại');
    }
  }

  private async ensureProductActive(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
  }

  async create(dto: CreatePurchaseItemDto) {
    await this.ensurePurchaseActive(dto.purchaseId);
    await this.ensureProductActive(dto.productId);
    const amount = dto.amount ?? dto.quantity * dto.unitPrice;
    const row = await this.prisma.purchaseItem.create({
      data: {
        purchaseId: dto.purchaseId,
        productId: dto.productId,
        quantity: dto.quantity,
        quantityUnit: dto.quantityUnit,
        unitPrice: dto.unitPrice,
        amount,
        avgWeightPerUnit: dto.avgWeightPerUnit,
        note: dto.note,
      },
    });
    await this.recalcPurchaseTotal(dto.purchaseId);
    return row;
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.purchaseItem.findMany({
        orderBy: { updatedAt: 'desc' },
        where: { deletedAt: null },
        ...query,
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
    const existing = await this.findOne(id);
    if (dto.purchaseId !== undefined) {
      await this.ensurePurchaseActive(dto.purchaseId);
    }
    if (dto.productId !== undefined) {
      await this.ensureProductActive(dto.productId);
    }

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unitPrice;
    const amount = dto.amount !== undefined ? dto.amount : quantity * unitPrice;

    const row = await this.prisma.purchaseItem.update({
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
        ...(dto.avgWeightPerUnit !== undefined && {
          avgWeightPerUnit: dto.avgWeightPerUnit,
        }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });

    await this.recalcPurchaseTotal(existing.purchaseId);
    if (
      dto.purchaseId !== undefined &&
      dto.purchaseId !== existing.purchaseId
    ) {
      await this.recalcPurchaseTotal(dto.purchaseId);
    }
    return row;
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    const purchaseId = row.purchaseId;
    const updated = await this.prisma.purchaseItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.recalcPurchaseTotal(purchaseId);
    return updated;
  }
}
