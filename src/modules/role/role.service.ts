import { Pagination } from '@/common/dtos';
import { IQuery, IQueryOne } from '@/common/interfaces';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findFirst({
      where: { name: dto.name },
    });

    if (existingRole) throw new ConflictException('Vai trò đã tồn tại');

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rolesPermissions: {
          create: dto.permissionIds?.map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
      include: { rolesPermissions: { include: { permission: true } } },
    });

    return role;
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

  async findOne(id: string, query: IQueryOne = {}) {
    const role = await this.prisma.role.findUnique({ where: { id }, ...query });
    if (!role) throw new NotFoundException('Vai trò không tồn tại');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,

        rolesPermissions: {
          deleteMany: {},
          create: dto.permissionIds?.map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
      include: { rolesPermissions: { include: { permission: true } } },
    });

    return role;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({ where: { id } });
  }
}
