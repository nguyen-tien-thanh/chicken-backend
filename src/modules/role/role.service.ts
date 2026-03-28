import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto });
  }

  findAll() {
    return this.prisma.role.findMany();
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
