import { PrismaClient, UserRole, LeadStatus, PropertyStatus, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-real-estate' },
    update: {},
    create: {
      name: 'Acme Real Estate',
      slug: 'acme-real-estate',
    },
  });

  // 2. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@acme.com' },
    update: {},
    create: {
      email: 'agent@acme.com',
      name: 'Agent Smith',
      role: UserRole.AGENT,
      organizationId: org.id,
    },
  });

  // 3. Create Contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      organizationId: org.id,
    },
  });

  // 4. Create Leads
  await prisma.lead.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      status: LeadStatus.NEW,
      organizationId: org.id,
      assignedUserId: agent.id,
    },
  });

  // 5. Create Properties
  const property = await prisma.property.create({
    data: {
      title: 'Luxury Villa in Beverly Hills',
      address: '123 Sunset Blvd, Beverly Hills, CA',
      price: 5000000,
      status: PropertyStatus.AVAILABLE,
      organizationId: org.id,
    },
  });

  // 6. Create Deal
  await prisma.deal.create({
    data: {
      title: 'Sunset Villa Purchase',
      value: 4800000,
      organizationId: org.id,
      contactId: contact1.id,
      propertyId: property.id,
      assignedUserId: agent.id,
    },
  });

  // 7. Create Activity
  await prisma.activity.create({
    data: {
      type: ActivityType.CALL,
      subject: 'Initial discovery call',
      content: 'Client is interested in luxury properties.',
      organizationId: org.id,
      contactId: contact1.id,
      createdById: agent.id,
    },
  });

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
