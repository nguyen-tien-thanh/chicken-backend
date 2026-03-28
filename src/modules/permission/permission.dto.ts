import { PartialType } from '@nestjs/swagger';

export class CreatePermissionDto {}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
