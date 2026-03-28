import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

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
        avgWeightPerUnit: item.avgWeightPerUnit,
        note: item.note,
      };
    });
    const totalAmount = itemsData.reduce((s, i) => s + i.amount, 0);

    return this.prisma.$transaction(async (tx) => {
      return tx.purchase.create({
        data: {
          purchaseDate: dto.purchaseDate,
          supplierId: dto.supplierId,
          note: dto.note,
          totalAmount,
          purchaseItems: { create: itemsData },
        },
        include: { purchaseItems: true, supplier: true },
      });
    });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.purchase.findMany({
        orderBy: { updatedAt: 'desc' },
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
    await this.findOne(id);
    const data: Prisma.PurchaseUpdateInput = {};
    if (dto.purchaseDate !== undefined) {
      data.purchaseDate = dto.purchaseDate;
    }
    if (dto.supplierId !== undefined) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, deletedAt: null },
      });
      if (!supplier) {
        throw new NotFoundException('Nhà cung cấp không tồn tại');
      }
      data.supplier = { connect: { id: dto.supplierId } };
    }
    if (dto.note !== undefined) {
      data.note = dto.note;
    }
    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }
    return this.prisma.purchase.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
