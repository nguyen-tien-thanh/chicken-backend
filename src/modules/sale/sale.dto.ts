import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateSaleItemLineDto } from '../sale-item/sale-item.dto';

export class UpdateSaleItemLineDto {
  @ApiPropertyOptional({ description: 'ID dòng hiện có để update; bỏ trống = tạo mới' })
  @IsOptional()
  @IsString()
  id?: string;

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

  @ApiPropertyOptional({ description: 'Nếu bỏ trống = quantity * unitPrice' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Giá vốn dòng; mặc định 0' })
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

export class CreateSaleDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  saleDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Mặc định 0' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Mặc định 0' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paidAmount?: number;

  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiProperty({ type: [CreateSaleItemLineDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemLineDto)
  @ArrayMinSize(1)
  items: CreateSaleItemLineDto[];
}

export class UpdateSaleDto {
  @ApiPropertyOptional()
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  saleDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paidAmount?: number;

  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({
    type: [UpdateSaleItemLineDto],
    description: 'Danh sách items mới. Items có id → update, không có id → tạo mới, items cũ không có trong list → xóa',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleItemLineDto)
  @ArrayMinSize(1)
  items?: UpdateSaleItemLineDto[];
}
