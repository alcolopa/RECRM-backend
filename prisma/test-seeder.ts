import { PrismaClient, UserRole, Permission, ContactType, ContactStatus, LeadStatus, PropertyStatus, PropertyType, FinancingType, OfferStatus, ActivityType, TaskStatus, NegotiationStatus, ListingType, SellingTimeline, BuyingTimeline, PurchasePurpose, ReasonForSelling } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔥 Initializing MEGA Test Seeder - Making the system alive...');

  const password = await bcrypt.hash('password', 10);
  const orgConfigs = [
    { name: 'Elite Realty Group', slug: 'elite-realty', niche: 'luxury', color: 'EMERALD' },
    { name: 'Urban Living Properties', slug: 'urban-living', niche: 'modern', color: 'BLUE' },
    { name: 'Metro Commercial & Industrial', slug: 'metro-comm', niche: 'commercial', color: 'INDIGO' }
  ];

  for (const config of orgConfigs) {
    console.log(`\n🏢 Building Organization: ${config.name}...`);

    // 1. Create Team
    const owner = await prisma.user.create({
      data: {
        email: `owner@${config.slug}.com`,
        password,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        avatar: faker.image.avatar(),
      }
    });

    const org = await prisma.organization.create({
      data: {
        name: config.name,
        slug: config.slug,
        email: `contact@${config.slug}.com`,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(true),
        website: `https://www.${config.slug}.com`,
        ownerId: owner.id,
        accentColor: config.color,
      }
    });

    await prisma.membership.create({
      data: { userId: owner.id, organizationId: org.id, role: UserRole.OWNER }
    });

    // Custom Roles
    const agentRole = await prisma.customRole.create({
      data: {
        name: 'Senior Broker',
        organizationId: org.id,
        permissions: Object.values(Permission)
      }
    });

    // Create 5 Agents
    const agents = await Promise.all(
      Array.from({ length: 5 }).map(async (_, i) => {
        const user = await prisma.user.create({
          data: {
            email: `agent${i + 1}@${config.slug}.com`,
            password,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            phone: faker.phone.number(),
            avatar: faker.image.avatar(),
          }
        });
        await prisma.membership.create({
          data: { userId: user.id, organizationId: org.id, role: UserRole.AGENT, customRoleId: agentRole.id }
        });
        return user;
      })
    );

    const team = [owner, ...agents];

    // 2. Create Contacts & Profiles (50 per org)
    console.log(`   👥 Generating 50 active contacts for ${config.slug}...`);
    const contacts = await Promise.all(
      Array.from({ length: 50 }).map(async () => {
        const type = faker.helpers.arrayElement([ContactType.BUYER, ContactType.SELLER, ContactType.BOTH]);
        const contact = await prisma.contact.create({
          data: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            type,
            status: faker.helpers.arrayElement(Object.values(ContactStatus)),
            organizationId: org.id,
            assignedAgentId: faker.helpers.arrayElement(team).id,
            notes: faker.lorem.paragraph(),
            createdAt: faker.date.past({ years: 1 })
          }
        });

        if (type !== ContactType.SELLER) {
          await prisma.buyerProfile.create({
            data: {
              contactId: contact.id,
              minBudget: config.niche === 'luxury' ? 1000000 : 200000,
              maxBudget: config.niche === 'luxury' ? 10000000 : 800000,
              buyingTimeline: faker.helpers.arrayElement(Object.values(BuyingTimeline)),
              purchasePurpose: faker.helpers.arrayElement(Object.values(PurchasePurpose)),
              preferredCities: [faker.location.city(), faker.location.city()],
              minBedrooms: faker.number.int({ min: 1, max: 5 }),
              preApproved: faker.datatype.boolean()
            }
          });
        }

        if (type !== ContactType.BUYER) {
          await prisma.sellerProfile.create({
            data: {
              contactId: contact.id,
              readyToList: faker.datatype.boolean(),
              sellingTimeline: faker.helpers.arrayElement(Object.values(SellingTimeline)),
              reasonForSelling: faker.helpers.arrayElement(Object.values(ReasonForSelling)),
              minimumPrice: config.niche === 'luxury' ? 900000 : 150000,
            }
          });
        }
        return contact;
      })
    );

    // 3. Create Properties (40 per org)
    console.log(`   🏠 Listing 40 properties...`);
    const sellers = await prisma.sellerProfile.findMany({ where: { contact: { organizationId: org.id } } });
    const properties = await Promise.all(
      Array.from({ length: 40 }).map(() => {
        const type = config.niche === 'commercial' 
          ? faker.helpers.arrayElement([PropertyType.COMMERCIAL, PropertyType.INDUSTRIAL, PropertyType.OFFICE, PropertyType.RETAIL])
          : faker.helpers.arrayElement([PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.VILLA, PropertyType.CONDO]);
        
        return prisma.property.create({
          data: {
            title: config.niche === 'luxury' ? `The ${faker.word.adjective()} ${faker.location.city()} Estate` : `${faker.location.street()} ${type}`,
            description: faker.lorem.paragraphs(3),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            country: 'USA',
            price: config.niche === 'luxury' ? faker.number.int({ min: 2000000, max: 15000000 }) : faker.number.int({ min: 200000, max: 900000 }),
            status: faker.helpers.arrayElement(Object.values(PropertyStatus)),
            type,
            bedrooms: type === PropertyType.HOUSE ? faker.number.int({ min: 2, max: 8 }) : null,
            bathrooms: type === PropertyType.HOUSE ? faker.number.int({ min: 1, max: 6 }) : null,
            area: faker.number.int({ min: 80, max: 2000 }),
            features: faker.helpers.arrayElements(['Smart Home', 'Security System', 'Pool', 'Solar Panels', 'Gated', 'High Ceilings', 'Garage'], 4),
            organizationId: org.id,
            sellerProfileId: faker.helpers.arrayElement(sellers).id,
            assignedUserId: faker.helpers.arrayElement(team).id,
          }
        });
      })
    );

    // 4. Create Leads (30 per org)
    console.log(`   📈 Processing 30 new leads...`);
    await Promise.all(
      Array.from({ length: 30 }).map(() => 
        prisma.lead.create({
          data: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            status: faker.helpers.arrayElement(Object.values(LeadStatus)),
            source: faker.helpers.arrayElement(['Website', 'Zillow', 'Referral', 'Google Ads', 'Cold Call']),
            budget: faker.number.int({ min: 200000, max: 5000000 }),
            organizationId: org.id,
            assignedUserId: faker.helpers.arrayElement(team).id,
            notes: faker.lorem.sentence()
          }
        })
      )
    );

    // 5. Create Negotiations & Deal Flow (30 negotiations)
    console.log(`   🤝 Orchestrating 30 active negotiations...`);
    const buyers = await prisma.buyerProfile.findMany({ where: { contact: { organizationId: org.id } } });
    for (let i = 0; i < 30; i++) {
      const prop = faker.helpers.arrayElement(properties);
      const buyer = faker.helpers.arrayElement(buyers);
      
      const neg = await prisma.offerNegotiation.create({
        data: {
          organizationId: org.id,
          propertyId: prop.id,
          contactId: buyer.contactId,
          createdById: faker.helpers.arrayElement(team).id,
          status: faker.helpers.arrayElement(Object.values(NegotiationStatus))
        }
      });

      // Create 1-4 offers per negotiation
      const offerRounds = faker.number.int({ min: 1, max: 4 });
      for (let j = 0; j < offerRounds; j++) {
        const isLast = j === offerRounds - 1;
        const offer = await prisma.offer.create({
          data: {
            price: Number(prop.price) * (0.85 + (j * 0.05)),
            financingType: faker.helpers.arrayElement(Object.values(FinancingType)),
            status: isLast ? OfferStatus.SUBMITTED : OfferStatus.COUNTERED,
            negotiationId: neg.id,
            organizationId: org.id,
            createdById: neg.createdById,
            offerer: j % 2 === 0 ? 'BUYER' : 'AGENCY',
            createdAt: faker.date.recent({ days: 30 })
          }
        });

        // Add history for each offer
        await prisma.offerHistory.create({
          data: {
            action: 'OFFER_CREATED',
            offerId: offer.id,
            userId: neg.createdById,
            offerer: offer.offerer
          }
        });
      }
    }

    // 6. Dense Activity & Task Log
    console.log(`   📅 Logging 100+ team activities...`);
    for (const contact of contacts) {
      // 2-3 Activities per contact
      for (let a = 0; a < faker.number.int({ min: 1, max: 3 }); a++) {
        await prisma.activity.create({
          data: {
            type: faker.helpers.arrayElement(Object.values(ActivityType)),
            subject: faker.helpers.arrayElement(['Property Tour', 'Initial Consultation', 'Document Review', 'Price Negotiation']),
            content: faker.lorem.paragraph(),
            organizationId: org.id,
            contactId: contact.id,
            createdById: faker.helpers.arrayElement(team).id,
            createdAt: faker.date.recent({ days: 60 })
          }
        });
      }

      // Tasks
      if (faker.datatype.boolean()) {
        await prisma.task.create({
          data: {
            title: `Follow up with ${contact.firstName}`,
            description: faker.lorem.sentence(),
            status: faker.helpers.arrayElement(Object.values(TaskStatus)),
            dueDate: faker.date.future(),
            organizationId: org.id,
            assignedUserId: faker.helpers.arrayElement(team).id
          }
        });
      }
    }
  }

  console.log('\n🌟 MEGA SEEDING COMPLETE - EstateHub is now ALIVE!');
  console.log('==================================================');
  orgConfigs.forEach(c => {
    console.log(`✅ Organization: ${c.name} (${c.slug})`);
    console.log(`   Credentials: owner@${c.slug}.com / password`);
    console.log(`   Agents:      agent1-5@${c.slug}.com / password`);
    console.log('--------------------------------------------------');
  });
  console.log('📊 TOTAL DATA GENERATED:');
  console.log(`   - Organizations:  3`);
  console.log(`   - Users:          ~20`);
  console.log(`   - Leads:          90`);
  console.log(`   - Contacts:       150`);
  console.log(`   - Properties:     120`);
  console.log(`   - Negotiations:   90`);
  console.log(`   - Activities:     ~300`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
