import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: dto.categoryId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Danh mục sản phẩm không tồn tại');
    }
    return this.prisma.product.create({ data: dto });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
        where: { deletedAt: null, ...query.where },
      }),
      this.prisma.product.count({
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
    const row = await this.prisma.product.findUnique({
      where: { id },
      ...query,
    });
    if (!row) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return row;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException('Danh mục sản phẩm không tồn tại');
      }
    }
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
