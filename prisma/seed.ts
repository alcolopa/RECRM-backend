import { PrismaClient, UserRole, LeadStatus, PropertyStatus, ActivityType, ContactType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      password: '$2b$10$dummyhashedpassword1234567890',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@acme.com' },
    update: {},
    create: {
      email: 'agent@acme.com',
      password: '$2b$10$dummyhashedpassword1234567890',
      firstName: 'Agent',
      lastName: 'Smith',
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
      type: ContactType.BUYER,
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

  // 8. Seed Features
  const features = [
    // Amenities
    { name: 'Swimming Pool', category: 'Amenities' },
    { name: 'Gym', category: 'Amenities' },
    { name: 'Spa', category: 'Amenities' },
    { name: 'Sauna', category: 'Amenities' },
    { name: 'Jacuzzi', category: 'Amenities' },
    { name: 'Playground', category: 'Amenities' },
    { name: 'Rooftop Terrace', category: 'Amenities' },
    { name: 'BBQ Area', category: 'Amenities' },
    { name: 'Clubhouse', category: 'Amenities' },

    // Outdoor
    { name: 'Garden', category: 'Outdoor' },
    { name: 'Balcony', category: 'Outdoor' },
    { name: 'Terrace', category: 'Outdoor' },
    { name: 'Patio', category: 'Outdoor' },
    { name: 'Yard', category: 'Outdoor' },
    { name: 'Sea View', category: 'Outdoor' },
    { name: 'Mountain View', category: 'Outdoor' },
    { name: 'City View', category: 'Outdoor' },

    // Interior
    { name: 'Furnished', category: 'Interior' },
    { name: 'Semi-Furnished', category: 'Interior' },
    { name: 'Open Kitchen', category: 'Interior' },
    { name: 'Closed Kitchen', category: 'Interior' },
    { name: 'Maid Room', category: 'Interior' },
    { name: 'Storage Room', category: 'Interior' },
    { name: 'Walk-in Closet', category: 'Interior' },
    { name: 'Laundry Room', category: 'Interior' },
    { name: 'Fireplace', category: 'Interior' },

    // Utilities
    { name: 'Generator', category: 'Utilities' },
    { name: 'Solar Panels', category: 'Utilities' },
    { name: 'Central AC', category: 'Utilities' },
    { name: 'Central Heating', category: 'Utilities' },
    { name: 'Water Well', category: 'Utilities' },
    { name: 'Water Tank', category: 'Utilities' },
    { name: 'Elevator', category: 'Utilities' },
    { name: 'Internet/Fiber', category: 'Utilities' },

    // Parking
    { name: 'Covered Parking', category: 'Parking' },
    { name: 'Underground Parking', category: 'Parking' },
    { name: 'Garage', category: 'Parking' },
    { name: 'Valet Parking', category: 'Parking' },

    // Security
    { name: '24/7 Security', category: 'Security' },
    { name: 'CCTV', category: 'Security' },
    { name: 'Intercom', category: 'Security' },
    { name: 'Gated Community', category: 'Security' },
    { name: 'Fire Alarm System', category: 'Security' },
    { name: 'Smart Home System', category: 'Security' },
    { name: 'Concierge', category: 'Security' },
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { name: feature.name },
      update: { category: feature.category },
      create: feature,
    });
  }

  console.log(`Seeded ${features.length} features.`);
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
