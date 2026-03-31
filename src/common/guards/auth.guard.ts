import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ERROR_CODE } from '../interfaces';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private _extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this._extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException({
        message: 'Không tìm thấy token',
        code: ERROR_CODE.TOKEN_MISSING,
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('jwt.secret'),
      });

      request['user'] = payload;
    } catch (error) {
      switch (error?.name) {
        case 'TokenExpiredError':
          throw new UnauthorizedException({
            message: 'Token đã hết hạn',
            code: ERROR_CODE.TOKEN_EXPIRED,
          });

        case 'JsonWebTokenError':
          throw new UnauthorizedException({
            message: 'Token không hợp lệ',
            code: ERROR_CODE.TOKEN_INVALID,
          });

        case 'NotBeforeError':
          throw new UnauthorizedException({
            message: 'Token chưa có hiệu lực',
            code: ERROR_CODE.TOKEN_NOT_ACTIVE,
          });

        default:
          throw new UnauthorizedException({
            message: 'Xác thực thất bại',
            code: ERROR_CODE.AUTH_FAILED,
          });
      }
    }

    return true;
  }
}
