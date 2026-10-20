import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding initial data...');

  // Seed default admin user
  const adminPassword = hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@iphonestock.com' },
    update: {},
    create: {
      name: 'Admin iPhone',
      email: 'admin@iphonestock.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('Default admin seeded: admin@iphonestock.com / admin123');

  // Clean existing transactional data
  await prisma.additionalCost.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.iPhoneUnit.deleteMany();

  // Unit 1: iPhone 15 Pro Max 256GB Natural Titanium (SOLD)
  const unit1 = await prisma.iPhoneUnit.create({
    data: {
      model: 'iPhone 15 Pro Max',
      capacity: '256GB',
      color: 'Natural Titanium',
      imei: '354892109845123',
      purchasePrice: 18500000,
      sellingPrice: 20500000,
      status: 'sold',
      purchase: {
        create: {
          supplier: 'Distributor Gadget Jakarta',
          purchaseDate: new Date('2026-10-01T10:00:00Z'),
          notes: 'Kondisi mulus like new, battery health 98%',
        },
      },
      sales: {
        create: [
          {
            sellingPrice: 20500000,
            quantity: 1,
            buyerName: 'Budi Santoso',
            buyerPhone: '081234567890',
            saleDate: new Date('2026-10-05T14:30:00Z'),
            notes: 'COD di store, bonus tempered glass',
            additionalCosts: {
              create: [
                {
                  description: 'Ongkir kurir instan ke buyer',
                  amount: 50000,
                  category: 'Ongkir',
                  date: new Date('2026-10-05T15:00:00Z'),
                },
                {
                  description: 'Bonus tempered glass + case',
                  amount: 75000,
                  category: 'Operasional',
                  date: new Date('2026-10-05T14:30:00Z'),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Unit 2: iPhone 13 128GB Midnight (SOLD)
  const unit2 = await prisma.iPhoneUnit.create({
    data: {
      model: 'iPhone 13',
      capacity: '128GB',
      color: 'Midnight',
      imei: '358912345678901',
      purchasePrice: 8000000,
      sellingPrice: 9500000,
      status: 'sold',
      purchase: {
        create: {
          supplier: 'Lelang HP Batam',
          purchaseDate: new Date('2026-10-03T09:00:00Z'),
          notes: 'LCD original, face id normal',
        },
      },
      sales: {
        create: [
          {
            sellingPrice: 9500000,
            quantity: 1,
            buyerName: 'Siti Rahma',
            buyerPhone: '085712349988',
            saleDate: new Date('2026-10-08T11:00:00Z'),
            notes: 'Transfer BCA lunas',
            additionalCosts: {
              create: [
                {
                  description: 'Ganti baterai OEM baru',
                  amount: 350000,
                  category: 'Servis',
                  date: new Date('2026-10-04T13:00:00Z'),
                },
                {
                  description: 'Packing kayu + bubble wrap JNE',
                  amount: 40000,
                  category: 'Ongkir',
                  date: new Date('2026-10-08T11:30:00Z'),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Unit 3: iPhone 14 128GB Starlight (AVAILABLE)
  await prisma.iPhoneUnit.create({
    data: {
      model: 'iPhone 14',
      capacity: '128GB',
      color: 'Starlight',
      imei: '356712098432156',
      purchasePrice: 10200000,
      status: 'available',
      purchase: {
        create: {
          supplier: 'iStore Surabaya',
          purchaseDate: new Date('2026-10-10T11:00:00Z'),
          notes: 'Fullset original box, BH 95%',
        },
      },
    },
  });

  // Unit 4: iPhone 15 128GB Black (AVAILABLE)
  await prisma.iPhoneUnit.create({
    data: {
      model: 'iPhone 15',
      capacity: '128GB',
      color: 'Black',
      imei: '359012384756192',
      purchasePrice: 12500000,
      status: 'available',
      purchase: {
        create: {
          supplier: 'Distributor Gadget Jakarta',
          purchaseDate: new Date('2026-10-12T13:00:00Z'),
          notes: 'Garansi resmi iBox aktif',
        },
      },
    },
  });

  // Unit 5: iPhone 15 Pro 256GB Blue Titanium (AVAILABLE)
  await prisma.iPhoneUnit.create({
    data: {
      model: 'iPhone 15 Pro',
      capacity: '256GB',
      color: 'Blue Titanium',
      imei: '351239847561029',
      purchasePrice: 16800000,
      status: 'available',
      purchase: {
        create: {
          supplier: 'Lelang HP Batam',
          purchaseDate: new Date('2026-10-15T09:30:00Z'),
          notes: 'Mulus 99%, kelengkapan kabel tipe C ori',
        },
      },
    },
  });

  // Unit 6: iPhone 11 64GB White (AVAILABLE)
  await prisma.iPhoneUnit.create({
    data: {
      model: 'iPhone 11',
      capacity: '64GB',
      color: 'White',
      imei: '353412098765432',
      purchasePrice: 4800000,
      status: 'available',
      purchase: {
        create: {
          supplier: 'Trade-in Customer',
          purchaseDate: new Date('2026-10-16T16:00:00Z'),
          notes: 'BH 85%, unit only',
        },
      },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

