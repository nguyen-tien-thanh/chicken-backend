import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export function ApiAuth() {
  return applyDecorators(
    UseGuards(AuthGuard, PermissionGuard),
    ApiBearerAuth('token'),
  );
}

export function ApiAuthNoPermission() {
  return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('token'));
}

// export function ApiOptionalAuth() {
//   return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('token'));
// }
