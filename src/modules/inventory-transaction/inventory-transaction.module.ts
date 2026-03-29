import { Module } from '@nestjs/common';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryTransactionController } from './inventory-transaction.controller';
import { InventoryTransactionService } from './inventory-transaction.service';

@Module({
  controllers: [InventoryTransactionController],
  providers: [InventoryTransactionService, InventoryLedgerService],
  exports: [InventoryTransactionService, InventoryLedgerService],
})
export class InventoryTransactionModule {}
