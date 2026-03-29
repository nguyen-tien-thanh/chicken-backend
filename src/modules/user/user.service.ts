import { Pagination } from '@/common/dtos';
import {
  IQueryOneWithoutInclude,
  IQueryWithoutInclude,
} from '@/common/interfaces';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

function omitPassword<T extends { password?: string }>(row: T) {
  const { password: _p, ...rest } = row;
  return rest;
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async hashPassword(plain: string) {
    return bcrypt.hash(
      plain,
      this.config.get<number>('bcrypt.saltRounds') ?? 10,
    );
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email đã tồn tại');

    const hashedPassword = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        roleId: dto.roleId,
      },
    });
    return omitPassword(user);
  }

  async findAll(query: IQueryWithoutInclude) {
    const { take = 10, skip, where, orderBy } = query;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: orderBy ?? { updatedAt: 'desc' },
        where: { ...where },
        ...query,
      }),
      this.prisma.user.count({
        where: { ...where },
      }),
    ]);
    return new Pagination({
      results: rows.map(omitPassword),
      currentPage: skip,
      pageSize: take,
      totalItems: total,
      next: skip < Math.ceil(total / take) ? skip + 1 : undefined,
      previous: skip > 1 ? skip - 1 : undefined,
    });
  }

  async findOne(id: string, query: IQueryOneWithoutInclude = {}) {
    const { select } = query;
    const user = await this.prisma.user.findFirst({
      where: { id },
      ...(select ? { select } : {}),
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return omitPassword(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const dup = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (dup) throw new ConflictException('Email đã tồn tại');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.roleId !== undefined) {
      data.role = { connect: { id: dto.roleId } };
    }
    if (dto.password !== undefined && dto.password !== '') {
      data.password = await this.hashPassword(dto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return omitPassword(user);
  }

  async remove(id: string) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    return omitPassword(user);
  }
}
