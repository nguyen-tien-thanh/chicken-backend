import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseItemLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Nếu bỏ trống = quantity * unitPrice',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreatePurchaseDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  purchaseDate: Date;

  @ApiProperty()
  @IsNumber()
  cagesCount: number;

  @ApiProperty()
  @IsNumber()
  cagesWeight: number;

  @ApiProperty()
  @IsNumber()
  averageWeight: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [CreatePurchaseItemLineDto] })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemLineDto)
  @ArrayMinSize(1)
  items: CreatePurchaseItemLineDto[];
}

export class UpdatePurchaseItemLineDto {
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
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Nếu bỏ trống = quantity * unitPrice',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePurchaseDto {
  @ApiPropertyOptional()
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  purchaseDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cagesCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cagesWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  averageWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string | null;

  @ApiPropertyOptional({
    type: [UpdatePurchaseItemLineDto],
    description: 'Danh sách items mới. Items có id → update, không có id → tạo mới, items cũ không có trong list → xóa',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemLineDto)
  @ArrayMinSize(1)
  items?: UpdatePurchaseItemLineDto[];
}
