import { Module } from '@nestjs/common';
import { InventoryTransactionModule } from '../inventory-transaction/inventory-transaction.module';
import { SaleModule } from '../sale/sale.module';
import { SaleItemController } from './sale-item.controller';
import { SaleItemService } from './sale-item.service';

@Module({
  imports: [SaleModule, InventoryTransactionModule],
  controllers: [SaleItemController],
  providers: [SaleItemService],
})
export class SaleItemModule {}
