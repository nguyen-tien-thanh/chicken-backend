import { BadRequestException, Injectable } from '@nestjs/common';
import {
  InventoryTransactionDirection,
  InventoryTransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tồn khả dụng = tổng IN − tổng OUT (theo product + đơn vị). */
  async getStock(productId: string, quantityUnit: string): Promise<number> {
    const [ins, outs] = await Promise.all([
      this.prisma.inventoryTransaction.aggregate({
        where: { productId, quantityUnit, direction: 'IN' },
        _sum: { quantity: true },
      }),
      this.prisma.inventoryTransaction.aggregate({
        where: { productId, quantityUnit, direction: 'OUT' },
        _sum: { quantity: true },
      }),
    ]);
    return (ins._sum.quantity ?? 0) - (outs._sum.quantity ?? 0);
  }

  /**
   * Kiểm tra đủ tồn cho nhiều dòng (cùng đơn có thể trùng sản phẩm — trừ dồn theo thứ tự).
   */
  async assertSaleLinesAvailable(
    lines: Array<{ productId: string; quantityUnit: string; quantity: number }>,
  ) {
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNameById = new Map(
      products.map((p) => [p.id, p.name] as const),
    );

    const pending = new Map<string, number>();

    for (const line of lines) {
      const key = `${line.productId}\0${line.quantityUnit}`;
      const base = await this.getStock(line.productId, line.quantityUnit);
      const reserved = pending.get(key) ?? 0;
      const available = base - reserved;
      if (line.quantity > available) {
        const productLabel =
          productNameById.get(line.productId) ?? line.productId;
        throw new BadRequestException(
          `Không đủ tồn kho (sản phẩm: ${productLabel}, đơn vị ${line.quantityUnit}): cần ${line.quantity}, khả dụng ${available}`,
        );
      }
      pending.set(key, reserved + line.quantity);
    }
  }

  async removeByRef(refType: InventoryTransactionType, refId: string) {
    await this.prisma.inventoryTransaction.deleteMany({
      where: { refType, refId },
    });
  }

  async syncPurchaseLineIn(
    purchaseItem: {
      id: string;
      productId: string;
      quantity: number;
      quantityUnit: string;
      unitPrice: number;
      amount: number;
      note?: string | null;
    },
    transactionDate: Date,
    purchaseNote?: string | null,
  ) {
    await this.removeByRef(InventoryTransactionType.PURCHASE, purchaseItem.id);
    await this.prisma.inventoryTransaction.create({
      data: {
        transactionDate,
        refType: InventoryTransactionType.PURCHASE,
        refId: purchaseItem.id,
        direction: InventoryTransactionDirection.IN,
        quantity: purchaseItem.quantity,
        quantityUnit: purchaseItem.quantityUnit,
        unitCost: purchaseItem.unitPrice,
        totalCost: purchaseItem.amount,
        productId: purchaseItem.productId,
        note: purchaseItem.note ?? purchaseNote ?? undefined,
      },
    });
  }

  async syncSaleLineOut(
    saleItem: {
      id: string;
      productId: string;
      quantity: number;
      quantityUnit: string;
      costAmount: number;
      note?: string | null;
    },
    transactionDate: Date,
    saleNote?: string | null,
  ) {
    await this.removeByRef(InventoryTransactionType.SALE, saleItem.id);
    const unitCost =
      saleItem.quantity > 0 ? saleItem.costAmount / saleItem.quantity : 0;
    await this.prisma.inventoryTransaction.create({
      data: {
        transactionDate,
        refType: InventoryTransactionType.SALE,
        refId: saleItem.id,
        direction: InventoryTransactionDirection.OUT,
        quantity: saleItem.quantity,
        quantityUnit: saleItem.quantityUnit,
        unitCost,
        totalCost: saleItem.costAmount,
        productId: saleItem.productId,
        note: saleItem.note ?? saleNote ?? undefined,
      },
    });
  }

  async removePurchaseInventoryForPurchase(purchaseId: string) {
    const items = await this.prisma.purchaseItem.findMany({
      where: { purchaseId },
      select: { id: true },
    });
    if (items.length === 0) return;
    await this.prisma.inventoryTransaction.deleteMany({
      where: {
        refType: InventoryTransactionType.PURCHASE,
        refId: { in: items.map((i) => i.id) },
      },
    });
  }

  async removeSaleInventoryForSale(saleId: string) {
    const items = await this.prisma.saleItem.findMany({
      where: { saleId },
      select: { id: true },
    });
    if (items.length === 0) return;
    await this.prisma.inventoryTransaction.deleteMany({
      where: {
        refType: InventoryTransactionType.SALE,
        refId: { in: items.map((i) => i.id) },
      },
    });
  }
}
