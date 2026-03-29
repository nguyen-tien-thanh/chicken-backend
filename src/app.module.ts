import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import envConfig from './config/env.config';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { InventoryTransactionModule } from './modules/inventory-transaction/inventory-transaction.module';
import { PermissionModule } from './modules/permission/permission.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductModule } from './modules/product/product.module';
import { PurchaseItemModule } from './modules/purchase-item/purchase-item.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { RoleModule } from './modules/role/role.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { UserModule } from './modules/user/user.module';
import { SaleModule } from './modules/sale/sale.module';
import { SaleItemModule } from './modules/sale-item/sale-item.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
    CacheModule.register({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    CustomerModule,
    SupplierModule,
    ProductCategoryModule,
    ProductModule,
    PurchaseModule,
    PurchaseItemModule,
    InventoryTransactionModule,
    UserModule,
    SaleModule,
    SaleItemModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
