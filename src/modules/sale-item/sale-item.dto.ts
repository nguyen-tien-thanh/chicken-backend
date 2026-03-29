import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSaleItemLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Nếu bỏ trống = quantity * unitPrice',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Giá vốn dòng; mặc định 0 (lợi nhuận = amount - costAmount)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateSaleItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Nếu bỏ trống = quantity * unitPrice',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateSaleItemDto extends PartialType(CreateSaleItemDto) {}
