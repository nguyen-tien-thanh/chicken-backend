import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) throw new UnauthorizedException('Email không tồn tại');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');

    const token = await this.jwt.signAsync(
      { id: user.id },
      { secret: this.config.get('jwt.secret') },
    );

    return { user, token };
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
      data: { ...registerDto, password: hashedPassword },
    });

    return userWithoutPassword;
  }
}
