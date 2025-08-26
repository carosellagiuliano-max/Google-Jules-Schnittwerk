import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Salon',
      domain: 'demo.deine-domain.ch',
      plan: 'premium',
    },
  });
  console.log(`Created tenant ${tenant.name} with id: ${tenant.id}`);

  // Create an owner for the demo tenant
  // In a real app, the password should not be hardcoded.
  // This user will also need to be created in Supabase Auth.
  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.deine-domain.ch',
      role: 'owner',
      tenantId: tenant.id,
      fullName: 'Demo Owner',
      // NOTE: Real applications should not store raw passwords.
      // This is a placeholder. Supabase handles auth, so this hash might not be used.
      hash: await hash('password123', 10),
    },
  });
  console.log(`Created owner ${owner.fullName} for tenant ${tenant.name}`);

  // Create a staff member
  const staff = await prisma.staff.create({
    data: {
        tenantId: tenant.id,
        name: 'Jane Doe',
        active: true,
    }
  });
  console.log(`Created staff member ${staff.name}`);

  // Create a service
  const service = await prisma.service.create({
    data: {
        tenantId: tenant.id,
        name: 'Haircut',
        duration: 30,
        price: 50,
        active: true,
    }
  });
  console.log(`Created service ${service.name}`);

  // Create a schedule for the staff member
  // Monday to Friday, 9am to 5pm
  for (let i = 1; i <= 5; i++) {
    await prisma.staffSchedule.create({
        data: {
            tenantId: tenant.id,
            staffId: staff.id,
            weekday: i,
            startMin: 9 * 60, // 9:00 AM
            endMin: 17 * 60, // 5:00 PM
        }
    });
  }
  console.log(`Created schedule for ${staff.name}`);


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
