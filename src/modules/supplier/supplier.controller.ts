import { IQuery, IQueryOne } from '@/common/interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSupplierDto, UpdateSupplierDto } from './supplier.dto';
import { SupplierService } from './supplier.service';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Get()
  findAll(@Query() query: IQuery) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: IQueryOne) {
    return this.supplierService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierService.remove(id);
  }
}
