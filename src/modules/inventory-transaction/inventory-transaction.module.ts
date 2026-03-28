import { Module } from '@nestjs/common';
import { InventoryTransactionController } from './inventory-transaction.controller';
import { InventoryTransactionService } from './inventory-transaction.service';

@Module({
  controllers: [InventoryTransactionController],
  providers: [InventoryTransactionService],
})
export class InventoryTransactionModule {}
