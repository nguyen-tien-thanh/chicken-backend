import { Module } from '@nestjs/common';
import { InventoryTransactionModule } from '../inventory-transaction/inventory-transaction.module';
import { PurchaseItemController } from './purchase-item.controller';
import { PurchaseItemService } from './purchase-item.service';

@Module({
  imports: [InventoryTransactionModule],
  controllers: [PurchaseItemController],
  providers: [PurchaseItemService],
})
export class PurchaseItemModule {}
