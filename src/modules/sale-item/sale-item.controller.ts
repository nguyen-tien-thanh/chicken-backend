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
import { CreateSaleItemDto, UpdateSaleItemDto } from './sale-item.dto';
import { SaleItemService } from './sale-item.service';

@Controller('sale-items')
export class SaleItemController {
  constructor(private readonly saleItemService: SaleItemService) {}

  @Post()
  create(@Body() dto: CreateSaleItemDto) {
    return this.saleItemService.create(dto);
  }

  @Get()
  findAll(@Query() query: IQuery) {
    return this.saleItemService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: IQueryOne) {
    return this.saleItemService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSaleItemDto) {
    return this.saleItemService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleItemService.remove(id);
  }
}
