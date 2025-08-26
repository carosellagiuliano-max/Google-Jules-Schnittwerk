import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define static UUIDs for demo users for consistency.
const DEMO_OWNER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_CUSTOMER_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
  console.log('Start seeding ...');

  // Use upsert for idempotency. This allows the seed script to be run multiple times
  // without creating duplicate data.
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'demo.deine-domain.ch' },
    update: {},
    create: {
      name: 'Demo Salon',
      domain: 'demo.deine-domain.ch',
      plan: 'premium',
    },
  });
  console.log(`Upserted tenant ${tenant.name} with id: ${tenant.id}`);

  // Create an owner for the demo tenant.
  // In a real app, this profile would be created by a webhook after a user signs up via Supabase.
  // The ID would come from the Supabase auth.users table.
  const owner = await prisma.profile.upsert({
    where: { id: DEMO_OWNER_ID },
    update: {},
    create: {
      id: DEMO_OWNER_ID,
      email: 'owner@demo.deine-domain.ch',
      role: 'owner',
      tenantId: tenant.id,
      fullName: 'Demo Owner',
      phone: '123-456-7890',
    },
  });
  console.log(`Upserted owner ${owner.fullName} for tenant ${tenant.name}`);
  console.log(`-> Test credentials: email=${owner.email}, password=password123 (set during Supabase signup)`);

  // Create a customer for the demo tenant.
  const customer = await prisma.profile.upsert({
      where: { id: DEMO_CUSTOMER_ID },
      update: {},
      create: {
        id: DEMO_CUSTOMER_ID,
        email: 'customer@demo.deine-domain.ch',
        role: 'customer',
        tenantId: tenant.id,
        fullName: 'Demo Customer',
        phone: '098-765-4321',
      },
    });
  console.log(`Upserted customer ${customer.fullName} for tenant ${tenant.name}`);
  console.log(`-> Test credentials: email=${customer.email}, password=password123 (set during Supabase signup)`);

  // Create a staff member
  const staff = await prisma.staff.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Jane Doe' } }, // Requires @@unique([tenantId, name]) on Staff
    update: {},
    create: {
        tenantId: tenant.id,
        name: 'Jane Doe',
        active: true,
    },
  });
  console.log(`Upserted staff member ${staff.name}`);

  // Create a service
  const service = await prisma.service.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Haircut' } }, // Requires @@unique([tenantId, name]) on Service
    update: {},
    create: {
        tenantId: tenant.id,
        name: 'Haircut',
        duration: 30,
        price: 50,
        active: true,
    },
  });
  console.log(`Upserted service ${service.name}`);

  // Create a schedule for the staff member
  for (let i = 1; i <= 5; i++) {
    await prisma.staffSchedule.upsert({
        where: { tenantId_staffId_weekday: { tenantId: tenant.id, staffId: staff.id, weekday: i } }, // Requires @@unique([tenantId, staffId, weekday])
        update: {
            startMin: 9 * 60,
            endMin: 17 * 60,
        },
        create: {
            tenantId: tenant.id,
            staffId: staff.id,
            weekday: i,
            startMin: 9 * 60, // 9:00 AM
            endMin: 17 * 60, // 5:00 PM
        }
    });
  }
  console.log(`Upserted schedule for ${staff.name}`);


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
