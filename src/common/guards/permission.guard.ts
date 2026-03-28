import { AuthService } from '@/modules/auth/auth.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  private defaultRoutes: { path: string; method: string }[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.defaultRoutes = await this.prisma.permission.findMany({
      where: { default: true },
      select: { path: true, method: true },
    });
  }

  /**
   * check if user authorized
   * @param context
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.route?.path;
    const method = request.method;

    const permissionPayload: Pick<Permission, 'path' | 'method'> = {
      path,
      method,
    };

    const permitted = this.checkIfDefaultRoute(permissionPayload);
    if (permitted) return true;

    return this.checkIfUserHavePermission(request.user, permissionPayload);
  }

  /**
   * check if route is default
   * @param permissionAgainst
   */
  checkIfDefaultRoute(permissionAgainst: Pick<Permission, 'path' | 'method'>) {
    const { path, method } = permissionAgainst;
    return this.defaultRoutes.some(
      (r) => r.path === path && r.method === method,
    );
  }

  /**
   * check if user have necessary permission to view resource
   * includes permissions from role (direct) and from permission groups
   */
  checkIfUserHavePermission(
    user: Awaited<ReturnType<AuthService['login']>>['user'],
    permissionAgainst: Pick<Permission, 'path' | 'method'>,
  ) {
    const { path, method } = permissionAgainst;

    if (!user?.role) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }

    if (user?.role?.rolesPermissions?.some((p) => p.permission.path === '*')) {
      return true;
    }

    const rolePermissions = user.role.rolesPermissions ?? [];

    return rolePermissions.some((p) => {
      const methodMatch = p.permission.method === method;
      const pathMatch = p.permission.path === path;
      return methodMatch && pathMatch;
    });
  }
}
