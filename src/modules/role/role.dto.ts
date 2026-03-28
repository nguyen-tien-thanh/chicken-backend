import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Role description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiProperty({ description: 'Permission ids' })
  @IsArray()
  @IsNotEmpty()
  permissionIds: string[];
}
