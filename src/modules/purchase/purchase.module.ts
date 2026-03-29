import { Module } from '@nestjs/common';
import { InventoryTransactionModule } from '../inventory-transaction/inventory-transaction.module';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

@Module({
  imports: [InventoryTransactionModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}
