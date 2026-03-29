import { Module } from '@nestjs/common';
import { SaleModule } from '../sale/sale.module';
import { SaleItemController } from './sale-item.controller';
import { SaleItemService } from './sale-item.service';

@Module({
  imports: [SaleModule],
  controllers: [SaleItemController],
  providers: [SaleItemService],
})
export class SaleItemModule {}
