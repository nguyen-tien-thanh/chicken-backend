import { Pagination } from '@/common/dtos';
import { IQuery } from '@/common/interfaces';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
      }),
      this.prisma.role.count({ where: query.where }),
    ]);

    return new Pagination({
      results: roles,
      currentPage: skip,
      pageSize: take,
      totalItems: total,
      next: skip < Math.ceil(total / take) ? skip + 1 : undefined,
      previous: skip > 1 ? skip - 1 : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateRoleDto) {
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }
}
