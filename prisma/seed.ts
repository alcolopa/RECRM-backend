import { PrismaClient, UserRole, LeadStatus, PropertyStatus, ActivityType, ContactType, FinancingType, BuyingTimeline, DealStage, Permission } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 0. Create Global System Roles
  console.log('Seeding global roles...');
  const globalRoles = [
    {
      name: 'Owner',
      description: 'Full system access',
      permissions: Object.values(Permission),
      level: 4,
      isSystem: true,
    },
    {
      name: 'Admin',
      description: 'Full access to all features except billing',
      permissions: Object.values(Permission).filter(p => p !== Permission.ORG_BILLING_VIEW),
      level: 3,
      isSystem: true,
    },
    {
      name: 'Agent',
      description: 'Manage leads, contacts, properties, tasks and calendar',
      permissions: [
        Permission.LEADS_VIEW, Permission.LEADS_CREATE, Permission.LEADS_EDIT,
        Permission.CONTACTS_VIEW, Permission.CONTACTS_CREATE, Permission.CONTACTS_EDIT,
        Permission.PROPERTIES_VIEW, Permission.PROPERTIES_CREATE, Permission.PROPERTIES_EDIT,
        Permission.DEALS_VIEW, Permission.DEALS_CREATE, Permission.DEALS_EDIT,
        Permission.TASKS_VIEW, Permission.TASKS_CREATE, Permission.TASKS_EDIT, Permission.TASKS_DELETE,
        Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT,
        Permission.DASHBOARD_VIEW, Permission.TEAM_VIEW
      ],
      level: 2,
      isSystem: true,
    },
    {
      name: 'Support',
      description: 'View only access to most features',
      permissions: [
        Permission.LEADS_VIEW, Permission.CONTACTS_VIEW, Permission.PROPERTIES_VIEW, 
        Permission.DEALS_VIEW, Permission.TASKS_VIEW, Permission.CALENDAR_VIEW,
        Permission.DASHBOARD_VIEW, Permission.TEAM_VIEW
      ],
      level: 1,
      isSystem: true,
    }
  ];

  const createdRoles: Record<string, any> = {};
  for (const roleData of globalRoles) {
    let role = await prisma.customRole.findFirst({
      where: { name: roleData.name, organizationId: null }
    });

    if (role) {
      role = await prisma.customRole.update({
        where: { id: role.id },
        data: { 
          permissions: roleData.permissions, 
          description: roleData.description,
          level: roleData.level 
        }
      });
    } else {
      role = await prisma.customRole.create({
        data: {
          ...roleData,
          organizationId: null,
        },
      });
    }
    createdRoles[roleData.name] = role;
  }

  // 1. Create Admin User first (needed for Org owner)
  const adminEmail = 'admin@acme.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: '$2b$10$dummyhashedpassword1234567890',
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // 2. Create Organization with Admin as owner
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-real-estate' },
    update: { ownerId: admin.id },
    create: {
      name: 'Acme Real Estate',
      slug: 'acme-real-estate',
      ownerId: admin.id,
    },
  });

  // 3. Create Memberships
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: org.id,
      },
    },
    update: { role: UserRole.OWNER, customRoleId: createdRoles['Owner'].id },
    create: {
      userId: admin.id,
      organizationId: org.id,
      role: UserRole.OWNER,
      customRoleId: createdRoles['Owner'].id,
    },
  });

  const agentEmail = 'agent@acme.com';
  const agent = await prisma.user.upsert({
    where: { email: agentEmail },
    update: {},
    create: {
      email: agentEmail,
      password: '$2b$10$dummyhashedpassword1234567890',
      firstName: 'Agent',
      lastName: 'Smith',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: agent.id,
        organizationId: org.id,
      },
    },
    update: { role: UserRole.AGENT, customRoleId: createdRoles['Agent'].id },
    create: {
      userId: agent.id,
      organizationId: org.id,
      role: UserRole.AGENT,
      customRoleId: createdRoles['Agent'].id,
    },
  });

  // 4. Create Contacts (Check if exists first to avoid duplicates)
  let contact1 = await prisma.contact.findFirst({
    where: { email: 'john.doe@example.com', organizationId: org.id }
  });

  if (!contact1) {
    contact1 = await prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        type: ContactType.BUYER,
        organizationId: org.id,
        assignedAgentId: agent.id,
        buyerProfile: {
          create: {
            minBudget: 1000000,
            maxBudget: 6000000,
            financingType: FinancingType.MORTGAGE,
            buyingTimeline: BuyingTimeline.ONE_TO_THREE_MONTHS,
          }
        }
      },
    });
  }

  // 5. Create Leads
  const leadEmail = 'jane.smith@example.com';
  const existingLead = await prisma.lead.findFirst({
    where: { email: leadEmail, organizationId: org.id }
  });

  if (!existingLead) {
    await prisma.lead.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: leadEmail,
        status: LeadStatus.NEW,
        organizationId: org.id,
        assignedUserId: agent.id,
      },
    });
  }

  // 6. Create Properties
  const propertyTitle = 'Luxury Villa in Beverly Hills';
  let property = await prisma.property.findFirst({
    where: { title: propertyTitle, organizationId: org.id }
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        title: propertyTitle,
        address: '123 Sunset Blvd, Beverly Hills, CA',
        price: 5000000,
        status: PropertyStatus.AVAILABLE,
        organizationId: org.id,
        assignedUserId: agent.id,
      },
    });
  }

  // 7. Create Deal
  const dealTitle = 'Sunset Villa Purchase';
  const existingDeal = await prisma.deal.findFirst({
    where: { title: dealTitle, organizationId: org.id }
  });

  if (!existingDeal && property && contact1) {
    await prisma.deal.create({
      data: {
        title: dealTitle,
        value: 4800000,
        stage: DealStage.NEGOTIATION,
        organizationId: org.id,
        contactId: contact1.id,
        propertyId: property.id,
        assignedUserId: agent.id,
      },
    });
  }

  // 7.5. Create Commission Config for the Organization
  console.log('Seeding commission config...');
  await prisma.commissionConfig.upsert({
    where: { organizationId: org.id },
    update: {
      rentBuyerValue: 1.0,
      rentBuyerType: 'MULTIPLIER',
      rentSellerValue: 1.0,
      rentSellerType: 'MULTIPLIER',
      rentAgentValue: 40.0, // 40% of total (2 months) = 0.8 months (~80% of one month)
      rentAgentType: 'PERCENTAGE',
      saleBuyerValue: 2.5,
      saleBuyerType: 'PERCENTAGE',
      saleSellerValue: 2.5,
      saleSellerType: 'PERCENTAGE',
      saleAgentValue: 40.0, // 40% of total (5%) = 2% of price
      saleAgentType: 'PERCENTAGE',
      paymentTiming: 'UPFRONT',
    },
    create: {
      organizationId: org.id,
      rentBuyerValue: 1.0,
      rentBuyerType: 'MULTIPLIER',
      rentSellerValue: 1.0,
      rentSellerType: 'MULTIPLIER',
      rentAgentValue: 40.0,
      rentAgentType: 'PERCENTAGE',
      saleBuyerValue: 2.5,
      saleBuyerType: 'PERCENTAGE',
      saleSellerValue: 2.5,
      saleSellerType: 'PERCENTAGE',
      saleAgentValue: 40.0,
      saleAgentType: 'PERCENTAGE',
      paymentTiming: 'UPFRONT',
    },
  });

  // 8. Create Activity (Only if no activities exist for this contact yet to keep it simple)
  if (contact1) {
    const activityCount = await prisma.activity.count({
      where: { contactId: contact1.id }
    });

    if (activityCount === 0) {
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
    }
  }

  // 9. Seed Features
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
