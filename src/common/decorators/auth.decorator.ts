import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/common';

export function ApiAuth() {
  return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('token'));
}

export function ApiAuthNoPermission() {
  return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('token'));
}

export function ApiOptionalAuth() {
  return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('token'));
}
