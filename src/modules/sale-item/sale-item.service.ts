import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaleService } from '../sale/sale.service';
import { CreateSaleItemDto, UpdateSaleItemDto } from './sale-item.dto';

@Injectable()
export class SaleItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saleService: SaleService,
  ) {}

  private async ensureSaleActive(saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, deletedAt: null },
    });
    if (!sale) {
      throw new NotFoundException('Đơn bán hàng không tồn tại');
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

  async create(dto: CreateSaleItemDto) {
    await this.ensureSaleActive(dto.saleId);
    await this.ensureProductActive(dto.productId);

    const amount = dto.amount ?? dto.quantity * dto.unitPrice;
    const costAmount = dto.costAmount ?? 0;
    const profitAmount = amount - costAmount;

    const row = await this.prisma.saleItem.create({
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
    await this.saleService.recalcSaleTotals(dto.saleId);
    return row;
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.saleItem.findMany({
        orderBy: { updatedAt: 'desc' },
        where: { deletedAt: null },
        ...query,
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
    const existing = await this.findOne(id);
    if (dto.saleId !== undefined) {
      await this.ensureSaleActive(dto.saleId);
    }
    if (dto.productId !== undefined) {
      await this.ensureProductActive(dto.productId);
    }

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unitPrice;
    const amount = dto.amount !== undefined ? dto.amount : quantity * unitPrice;
    const costAmount = dto.costAmount ?? existing.costAmount;
    const profitAmount = amount - costAmount;

    const row = await this.prisma.saleItem.update({
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

    await this.saleService.recalcSaleTotals(existing.saleId);
    if (dto.saleId !== undefined && dto.saleId !== existing.saleId) {
      await this.saleService.recalcSaleTotals(dto.saleId);
    }
    return row;
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    const saleId = row.saleId;
    const updated = await this.prisma.saleItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.saleService.recalcSaleTotals(saleId);
    return updated;
  }
}
