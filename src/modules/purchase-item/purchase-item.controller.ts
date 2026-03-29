import { Query } from '@/common/decorators';
import { IQuery, IQueryOne } from '@/common/interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreatePurchaseItemDto,
  UpdatePurchaseItemDto,
} from './purchase-item.dto';
import { PurchaseItemService } from './purchase-item.service';

@Controller('purchase-items')
export class PurchaseItemController {
  constructor(private readonly purchaseItemService: PurchaseItemService) {}

  @Post()
  create(@Body() dto: CreatePurchaseItemDto) {
    return this.purchaseItemService.create(dto);
  }

  @Get()
  findAll(@Query() query: IQuery) {
    return this.purchaseItemService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: IQueryOne) {
    return this.purchaseItemService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseItemDto) {
    return this.purchaseItemService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseItemService.remove(id);
  }
}
