import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined ');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  // 🔥 clear dữ liệu (optional)
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 👇 tạo role
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Admin role',
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'STAFF',
      description: 'Staff role',
    },
  });

  // 👇 tạo user
  await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      password: '123456',
      name: 'Admin',
      roleId: adminRole.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'staff@gmail.com',
      password: '123456',
      name: 'Staff',
      roleId: staffRole.id,
    },
  });

  console.log('🌱 Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
