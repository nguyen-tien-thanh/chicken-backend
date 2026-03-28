import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,}$/, {
    message: 'Số điện thoại phải có ít nhất 10 chữ số',
  })
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
