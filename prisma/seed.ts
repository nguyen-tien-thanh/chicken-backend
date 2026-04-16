import { PrismaPg } from '@prisma/adapter-pg';
import { Method, PrismaClient, ProductType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined ');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function seedBusiness(prisma: PrismaClient) {
  // ===== SUPPLIER =====
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Trại gà A',
      phone: '0900000001',
      address: 'Củ Chi',
    },
  });

  // ===== CATEGORY =====
  const category = await prisma.productCategory.create({
    data: {
      name: 'Gà',
    },
  });

  // ===== PRODUCT =====
  const gaSong = await prisma.product.create({
    data: {
      name: 'Gà công nghiệp sống',
      type: ProductType.LIVE,
      categoryId: category.id,
    },
  });

  const gaLam = await prisma.product.create({
    data: {
      name: 'Gà công nghiệp làm sẵn',
      type: ProductType.PROCESSED,
      categoryId: category.id,
    },
  });

  // ===== PURCHASE =====
  const purchase = await prisma.purchase.create({
    data: {
      supplierId: supplier.id,
      purchaseDate: new Date(),
      cagesCount: 5,
      cagesWeight: 5,
      averageWeight: 3.96,
      totalAmount: 12000000,
      note: 'Nhập gà sáng',
    },
  });

  // ===== PURCHASE ITEM =====
  const quantity = 100; // 100 con
  const avgWeight = 2; // 2kg/con
  const totalWeight = quantity * avgWeight; // 200kg
  const unitPrice = 120000;

  const purchaseItem = await prisma.purchaseItem.create({
    data: {
      purchaseId: purchase.id,
      productId: gaSong.id,
      quantity,
      quantityUnit: 'con',
      unitPrice,
      amount: quantity * unitPrice,
      note: 'Gà đẹp',
    },
  });

  // ===== INVENTORY (NHẬP KHO) =====
  const costPerKg = (quantity * unitPrice) / totalWeight;

  await prisma.inventoryTransaction.create({
    data: {
      productId: gaSong.id,
      transactionDate: new Date(),
      refType: 'PURCHASE',
      refId: purchase.id,
      direction: 'IN',
      quantity: totalWeight, // 🔥 convert sang kg
      quantityUnit: 'kg',
      unitCost: costPerKg,
      totalCost: costPerKg * totalWeight,
      note: 'Nhập kho từ purchase',
    },
  });

  console.log('✅ Seed business done');
}

async function seedPermissions(prisma: PrismaClient) {
  await prisma.user.deleteMany();
  await prisma.rolesPermissions.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  const permissions = await prisma.permission.createManyAndReturn({
    data: [{ path: '*', method: Method.GET, default: true }],
  });

  const roles = await prisma.role.createManyAndReturn({
    data: [
      {
        name: 'ADMIN',
        description: 'Admin role',
      },
      {
        name: 'STAFF',
        description: 'Staff role',
      },
      {
        name: 'USER',
        description: 'User role',
      },
    ],
    skipDuplicates: true,
  });

  const adminRole = roles.find((r) => r.name === 'ADMIN');
  await prisma.rolesPermissions.createMany({
    data: permissions.map((p) => ({
      roleId: adminRole!.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        email: 'admin@gmail.com',
        password: await bcrypt.hash('admin', 10),
        name: 'Admin',
        roleId: roles.find((role) => role.name === 'ADMIN')?.id ?? '',
      },
      {
        email: 'staff@gmail.com',
        password: await bcrypt.hash('staff', 10),
        name: 'Staff',
        roleId: roles.find((role) => role.name === 'STAFF')?.id ?? '',
      },
      {
        email: 'user@gmail.com',
        password: await bcrypt.hash('user', 10),
        name: 'User',
        roleId: roles.find((role) => role.name === 'USER')?.id ?? '',
      },
    ],
    skipDuplicates: true,
  });
  console.log('🌱 Seed permissions done');
}

async function main() {
  await seedPermissions(prisma);
  await seedBusiness(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
