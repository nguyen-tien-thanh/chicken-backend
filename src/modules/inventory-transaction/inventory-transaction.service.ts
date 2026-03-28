import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryTransactionDto,
  UpdateInventoryTransactionDto,
} from './inventory-transaction.dto';

@Injectable()
export class InventoryTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryTransactionDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return this.prisma.inventoryTransaction.create({ data: dto });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
      }),
      this.prisma.inventoryTransaction.count({
        where: { ...query.where },
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
    const row = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      ...query,
    });
    if (!row) {
      throw new NotFoundException('Giao dịch kho không tồn tại');
    }
    return row;
  }

  async update(id: string, dto: UpdateInventoryTransactionDto) {
    await this.findOne(id);
    if (dto.productId !== undefined) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
      });
      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }
    }
    return this.prisma.inventoryTransaction.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.inventoryTransaction.delete({ where: { id } });
  }
}
