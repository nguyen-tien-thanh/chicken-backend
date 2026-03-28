import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  InventoryTransactionDirection,
  InventoryTransactionType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInventoryTransactionDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  transactionDate: Date;

  @ApiProperty({ enum: InventoryTransactionType })
  @IsEnum(InventoryTransactionType)
  refType: InventoryTransactionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refId: string;

  @ApiProperty({ enum: InventoryTransactionDirection })
  @IsEnum(InventoryTransactionDirection)
  direction: InventoryTransactionDirection;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiProperty()
  @IsNumber()
  unitCost: number;

  @ApiProperty()
  @IsNumber()
  totalCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class UpdateInventoryTransactionDto extends PartialType(
  CreateInventoryTransactionDto,
) {}
