import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Method } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission path' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({
    description: 'Permission method',
    enum: Method,
    default: Method.GET,
  })
  @IsEnum(Method)
  @IsNotEmpty()
  method: Method = Method.GET;

  @ApiProperty({ description: 'Permission description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
