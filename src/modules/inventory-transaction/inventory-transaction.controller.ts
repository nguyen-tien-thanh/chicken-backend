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
  CreateInventoryTransactionDto,
  UpdateInventoryTransactionDto,
} from './inventory-transaction.dto';
import { InventoryTransactionService } from './inventory-transaction.service';

@Controller('inventory-transactions')
export class InventoryTransactionController {
  constructor(
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) {}

  @Post()
  create(@Body() dto: CreateInventoryTransactionDto) {
    return this.inventoryTransactionService.create(dto);
  }

  @Get()
  findAll(@Query() query: IQuery) {
    return this.inventoryTransactionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: IQueryOne) {
    return this.inventoryTransactionService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryTransactionDto) {
    return this.inventoryTransactionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryTransactionService.remove(id);
  }
}
