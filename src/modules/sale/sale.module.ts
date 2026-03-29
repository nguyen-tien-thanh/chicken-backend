import { Module } from '@nestjs/common';
import { InventoryTransactionModule } from '../inventory-transaction/inventory-transaction.module';
import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';

@Module({
  imports: [InventoryTransactionModule],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
