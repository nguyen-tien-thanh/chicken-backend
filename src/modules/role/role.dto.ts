import { PartialType } from '@nestjs/swagger';

export class CreateRoleDto {}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
