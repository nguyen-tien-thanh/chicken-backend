import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: {
          select: {
            rolesPermissions: {
              select: {
                permission: {
                  select: { id: true, path: true, method: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Email không tồn tại');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Mật khẩu không chính xác');

    const { password, ...userWithoutPassword } = user;
    const token = await this.jwt.signAsync(
      { ...userWithoutPassword },
      { secret: this.config.get('jwt.secret') },
    );

    return { user: userWithoutPassword, token };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) throw new ConflictException('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.config.get<number>('bcrypt.saltRounds') ?? 10,
    );

    const { password, ...userWithoutPassword } = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        role: { connect: { name: 'USER' } },
      },
    });

    return userWithoutPassword;
  }

  async profile(user: User) {
    return this.prisma.user.findFirst({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            rolesPermissions: {
              select: {
                permission: { select: { id: true, path: true, method: true } },
              },
            },
          },
        },
      },
    });
  }
}
