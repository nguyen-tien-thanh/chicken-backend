import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePurchaseItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purchaseId: string;

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

  @ApiProperty()
  @IsNumber()
  avgWeightPerUnit: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePurchaseItemDto extends PartialType(CreatePurchaseItemDto) {}
