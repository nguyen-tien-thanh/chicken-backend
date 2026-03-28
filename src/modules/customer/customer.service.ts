import { Pagination } from '@/common/dtos';
import {
  IQueryOneWithoutInclude,
  IQueryWithoutInclude,
} from '@/common/interfaces';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  async findAll(query: IQueryWithoutInclude) {
    const { take = 10, skip } = query;
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        orderBy: { updatedAt: 'desc' },
        where: { deletedAt: null },
        ...query,
      }),
      this.prisma.customer.count({
        where: { deletedAt: null, ...query.where },
      }),
    ]);
    return new Pagination({
      results: customers,
      currentPage: skip,
      pageSize: take,
      totalItems: total,
      next: skip < Math.ceil(total / take) ? skip + 1 : undefined,
      previous: skip > 1 ? skip - 1 : undefined,
    });
  }

  async findOne(id: string, query: IQueryOneWithoutInclude = {}) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      ...query,
    });
    if (!customer) throw new NotFoundException('Khách hàng không tồn tại');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
