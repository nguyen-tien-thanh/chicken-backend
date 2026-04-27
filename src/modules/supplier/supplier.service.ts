import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
        where: { deletedAt: null, ...query.where },
      }),
      this.prisma.supplier.count({
        where: { deletedAt: null, ...query.where },
      }),
    ]);
    return new Pagination({
      results: suppliers,
      currentPage: skip,
      pageSize: take,
      totalItems: total,
      next: skip < Math.ceil(total / take) ? skip + 1 : undefined,
      previous: skip > 1 ? skip - 1 : undefined,
    });
  }

  async findOne(id: string, query: IQueryOne = {}) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      ...query,
    });
    if (!supplier) throw new NotFoundException('Nhà cung cấp không tồn tại');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
