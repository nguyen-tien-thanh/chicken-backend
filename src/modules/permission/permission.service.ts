import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './permission.dto';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto });
  }

  findAll() {
    return this.prisma.permission.findMany();
  }

  findOne(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }
}
