import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.duty.deleteMany();
  await prisma.route.deleteMany();
  await prisma.unit.deleteMany();

  const centroNorte = await prisma.route.create({
    data: {
      name: 'Centro - Norte',
      points: {
        create: [
          { sequence: 0, lat: 18.4861, lng: -69.9312 },
          { sequence: 1, lat: 18.4955, lng: -69.9401 },
          { sequence: 2, lat: 18.5104, lng: -69.9498 },
        ],
      },
    },
  });

  const malecon = await prisma.route.create({
    data: {
      name: 'Malecon Express',
      points: {
        create: [
          { sequence: 0, lat: 18.4655, lng: -69.9401 },
          { sequence: 1, lat: 18.4612, lng: -69.9155 },
          { sequence: 2, lat: 18.4589, lng: -69.8902 },
        ],
      },
    },
  });

  const bus014 = await prisma.unit.create({ data: { name: 'BUS-014' } });
  const bus027 = await prisma.unit.create({ data: { name: 'BUS-027' } });

  await prisma.duty.createMany({
    data: [
      {
        routeId: centroNorte.id,
        unitId: bus014.id,
        startAt: new Date('2026-08-24T06:00:00Z'),
        durationMinutes: 90,
      },
      {
        routeId: malecon.id,
        unitId: bus014.id,
        startAt: new Date('2026-08-24T08:00:00Z'),
        durationMinutes: 60,
      },
      {
        routeId: centroNorte.id,
        unitId: bus027.id,
        startAt: new Date('2026-08-24T07:30:00Z'),
        durationMinutes: 90,
      },
    ],
  });

  console.log('Seeded 2 routes, 2 units, 3 duties');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
