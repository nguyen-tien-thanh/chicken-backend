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
import { VietQRService } from '../vietqr/vietqr.service';
import { CreateSaleDto, UpdateSaleDto } from './sale.dto';
import { SaleService } from './sale.service';

@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly vietqr: VietQRService,
  ) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.saleService.create(dto);
  }

  @Get()
  findAll(@Query() query: IQuery) {
    return this.saleService.findAll(query);
  }

  @Get(':id/invoice')
  async getInvoice(@Param('id') id: string) {
    const sale = await this.saleService.findOne(id, {
      include: {
        saleItems: { where: { deletedAt: null }, include: { product: true } },
        customer: true,
      },
    });

    const qrUrl = this.vietqr.generateQRUrl(sale.remainingAmount, id);

    return {
      ...sale,
      payment: {
        saleId: id,
        amount: sale.remainingAmount,
        id,
        qrUrl,
      },
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: IQueryOne) {
    return this.saleService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.saleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleService.remove(id);
  }
}
