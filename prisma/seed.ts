import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined ');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

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
