import { Pagination } from '@/common/dtos';
import { IQuery } from '@/common/interfaces';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './permission.dto';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const permission = await this.prisma.permission.findFirst({
      where: { path: dto.path, method: dto.method },
    });
    if (permission) throw new ConflictException('Quyền đã tồn tại');
    return this.prisma.permission.create({ data: dto });
  }

  async findAll(query: IQuery) {
    const { take = 10, skip } = query;
    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        orderBy: { updatedAt: 'desc' },
        ...query,
      }),
      this.prisma.permission.count({ where: query.where }),
    ]);
    return new Pagination({
      results: permissions,
      currentPage: skip,
      pageSize: take,
      totalItems: total,
      next: skip < Math.ceil(total / take) ? skip + 1 : undefined,
      previous: skip > 1 ? skip - 1 : undefined,
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Quyền không tồn tại');
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.permission.delete({ where: { id } });
  }
}
