import { PrismaClient, UserRole, Permission, ContactType, ContactStatus, LeadStatus, PropertyStatus, PropertyType, FinancingType, OfferStatus, ActivityType, TaskStatus, NegotiationStatus, ListingType, SellingTimeline, BuyingTimeline, PurchasePurpose, ReasonForSelling, DealStage, DealType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LUXURY_IMAGES = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600607687940-4e2a0969de22?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600585154542-49da263e8b03?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=60'
];

const URBAN_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1449156001437-331016278897?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1522708323590-d248b6d0267d?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1469022563428-aa04fef9fbf1?auto=format&fit=crop&w=800&q=60'
];

const COMMERCIAL_IMAGES = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=60'
];

const LUXURY_TITLES = ["The Obsidian Villa", "Azure Coast Estate", "Marble Arch Manor", "Emerald Heights", "Silverwood Penthouse", "Golden Gate Mansion", "Royal Ivy Gardens", "Celestial View Peak"];
const URBAN_TITLES = ["Brick & Mortar Lofts", "City Pulse Apartments", "Neon Square Studio", "The Metropolitan", "Skyline View Condo", "Union Station Quarter", "Liberty Heights", "Metro Central Tower"];
const COMMERCIAL_TITLES = ["Nexus Business Park", "Summit Logistics Hub", "The Corner Plaza", "Harbor Industrial Center", "Main St Retail Collective", "Innovation Way Office", "Tech Boulevard", "Global Trade Center"];

const FEATURES = [
  "Smart Home System", "Security System", "Swimming Pool", "Solar Panels", "Gated Community",
  "High Ceilings", "Private Garage", "Chef's Kitchen", "Wine Cellar", "Home Theater",
  "Gym/Fitness Room", "Balcony/Terrace", "Landscaped Garden", "Central Air Conditioning",
  "Hardwood Floors", "Walk-in Closet", "Electric Vehicle Charging", "Concierge Service"
];

async function main() {
  console.log('🔥 Initializing MEGA Test Seeder - Making the system alive...');

  const password = await bcrypt.hash('password', 10);
  const orgConfigs = [
    { name: 'Elite Realty Group', slug: 'elite-realty', niche: 'luxury', color: 'EMERALD' },
    { name: 'Urban Living Properties', slug: 'urban-living', niche: 'modern', color: 'BLUE' },
    { name: 'Metro Commercial & Industrial', slug: 'metro-comm', niche: 'commercial', color: 'INDIGO' }
  ];

  console.log('🧹 Clearing existing test data...');
  // Delete in order to respect constraints
  await prisma.activity.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.offerHistory.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.offerNegotiation.deleteMany({});
  await prisma.propertyFeature.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.buyerProfile.deleteMany({});
  await prisma.sellerProfile.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.customRole.deleteMany({});
  await prisma.commissionConfig.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { contains: '@' } } }); // Clean up all seeded users

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

    // 1.2 Create Commission Config
    await prisma.commissionConfig.create({
      data: {
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
      }
    });

    // Custom Roles
    const agentRole = await prisma.customRole.create({
      data: {
        name: 'Senior Broker',
        organizationId: org.id,
        permissions: Object.values(Permission),
        level: 2
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

    // 1.5 Create Features for the system if they don't exist
    console.log(`   🛠️  Ensuring property features exist...`);
    const featureRecords = await Promise.all(
      FEATURES.map(name => 
        prisma.feature.upsert({
          where: { name },
          update: {},
          create: { name, category: 'Common' }
        })
      )
    );

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
      Array.from({ length: 40 }).map(async (_, index) => {
        const type = config.niche === 'commercial' 
          ? faker.helpers.arrayElement([PropertyType.COMMERCIAL, PropertyType.INDUSTRIAL, PropertyType.OFFICE, PropertyType.RETAIL])
          : faker.helpers.arrayElement([PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.VILLA, PropertyType.CONDO]);
        
        let title = '';
        let images: string[] = [];
        
        if (config.niche === 'luxury') {
          title = LUXURY_TITLES[index % LUXURY_TITLES.length] + ' ' + (index > LUXURY_TITLES.length ? index : '');
          images = LUXURY_IMAGES;
        } else if (config.niche === 'commercial') {
          title = COMMERCIAL_TITLES[index % COMMERCIAL_TITLES.length] + ' ' + (index > COMMERCIAL_TITLES.length ? index : '');
          images = COMMERCIAL_IMAGES;
        } else {
          title = URBAN_TITLES[index % URBAN_TITLES.length] + ' ' + (index > URBAN_TITLES.length ? index : '');
          images = URBAN_IMAGES;
        }

        const prop = await prisma.property.create({
          data: {
            title,
            description: faker.lorem.paragraphs(3),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            country: 'USA',
            price: config.niche === 'luxury' ? faker.number.int({ min: 2000000, max: 15000000 }) : faker.number.int({ min: 200000, max: 900000 }),
            status: faker.helpers.arrayElement(Object.values(PropertyStatus)),
            type,
            bedrooms: type === PropertyType.HOUSE || type === PropertyType.VILLA ? faker.number.int({ min: 2, max: 8 }) : (type === PropertyType.APARTMENT ? faker.number.int({ min: 1, max: 4 }) : null),
            bathrooms: type === PropertyType.HOUSE || type === PropertyType.VILLA ? faker.number.int({ min: 1, max: 6 }) : (type === PropertyType.APARTMENT ? faker.number.int({ min: 1, max: 3 }) : null),
            area: faker.number.int({ min: 80, max: 2000 }),
            features: faker.helpers.arrayElements(FEATURES, 4),
            organizationId: org.id,
            sellerProfileId: faker.helpers.arrayElement(sellers).id,
            assignedUserId: faker.helpers.arrayElement(team).id,
          }
        });

        // Add 3-5 images per property
        const selectedImages = faker.helpers.arrayElements(images, faker.number.int({ min: 3, max: 5 }));
        await Promise.all(selectedImages.map(url => 
          prisma.propertyImage.create({
            data: { url, propertyId: prop.id }
          })
        ));

        // Add 3-6 property features
        const selectedFeatures = faker.helpers.arrayElements(featureRecords, faker.number.int({ min: 3, max: 6 }));
        await Promise.all(selectedFeatures.map(f => 
          prisma.propertyFeature.create({
            data: { featureId: f.id, propertyId: prop.id }
          })
        ));

        return prop;
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

    // 7. Create Deal Records (15 per org)
    console.log(`   💰 Seeding 15 deals for ${config.slug}...`);
    for (let i = 0; i < 15; i++) {
      const prop = faker.helpers.arrayElement(properties);
      const contact = faker.helpers.arrayElement(contacts);
      const stage = faker.helpers.arrayElement(Object.values(DealStage));
      const type = faker.helpers.arrayElement([DealType.SALE, DealType.RENT]);
      
      const value = type === DealType.SALE 
        ? Number(prop.price) 
        : Number(prop.price) / 100; // Mock rent as 1% of price

      const isWon = stage === DealStage.CLOSED_WON;
      
      // Calculate mock commissions
      const totalCommission = isWon ? value * 0.05 : 0;
      const agentCommission = isWon ? totalCommission * 0.4 : 0;

      await prisma.deal.create({
        data: {
          title: `${prop.title} - ${contact.firstName} ${contact.lastName}`,
          organizationId: org.id,
          propertyId: prop.id,
          contactId: contact.id,
          assignedUserId: faker.helpers.arrayElement(team).id,
          stage,
          type,
          value: isWon ? value : null,
          propertyPrice: type === DealType.SALE ? value : null,
          rentPrice: type === DealType.RENT ? value : null,
          totalCommission: isWon ? totalCommission : null,
          agentCommission: agentCommission,
          isAgentPaid: i < 3, // Mark first 3 deals as paid
          agentPaidAt: i < 3 ? new Date() : null,
          createdAt: faker.date.recent({ days: 120 }),
        }
      });
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
