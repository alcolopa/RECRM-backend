-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED', 'MULTIPLIER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'INACTIVE', 'CANCELED');

-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('USER', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('LEADS_VIEW', 'LEADS_CREATE', 'LEADS_EDIT', 'LEADS_DELETE', 'LEADS_EXPORT', 'CONTACTS_VIEW', 'CONTACTS_CREATE', 'CONTACTS_EDIT', 'CONTACTS_DELETE', 'CONTACTS_EXPORT', 'PROPERTIES_VIEW', 'PROPERTIES_CREATE', 'PROPERTIES_EDIT', 'PROPERTIES_DELETE', 'DEALS_VIEW', 'DEALS_CREATE', 'DEALS_EDIT', 'DEALS_DELETE', 'TEAM_VIEW', 'TEAM_INVITE', 'TEAM_EDIT_ROLES', 'TEAM_REMOVE_MEMBER', 'ORG_SETTINGS_EDIT', 'ORG_BILLING_VIEW', 'DASHBOARD_VIEW', 'PAYOUTS_VIEW', 'PAYOUTS_MANAGE', 'TASKS_VIEW', 'TASKS_VIEW_ALL', 'TASKS_CREATE', 'TASKS_ASSIGN_ANY', 'TASKS_EDIT', 'TASKS_DELETE', 'CALENDAR_VIEW', 'CALENDAR_VIEW_ALL', 'CALENDAR_EDIT');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'CALL', 'SITE_VISIT', 'BLOCKER', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'AGENT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "UnitPreference" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrganizationTheme" AS ENUM ('LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'ACTIVE', 'INACTIVE', 'LOST');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BUYER', 'SELLER', 'BOTH');

-- CreateEnum
CREATE TYPE "FinancingType" AS ENUM ('CASH', 'MORTGAGE', 'PRIVATE_FINANCING', 'OTHER');

-- CreateEnum
CREATE TYPE "BuyingTimeline" AS ENUM ('ASAP', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'SIX_PLUS_MONTHS', 'JUST_LOOKING');

-- CreateEnum
CREATE TYPE "PurchasePurpose" AS ENUM ('PRIMARY_RESIDENCE', 'INVESTMENT', 'VACATION_HOME', 'RELOCATION');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('EXCLUSIVE', 'NON_EXCLUSIVE');

-- CreateEnum
CREATE TYPE "SellingTimeline" AS ENUM ('ASAP', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'SIX_PLUS_MONTHS', 'JUST_EXPLORING');

-- CreateEnum
CREATE TYPE "ReasonForSelling" AS ENUM ('UPGRADE', 'RELOCATION', 'INVESTMENT_EXIT', 'FINANCIAL_NEED', 'DIVORCE', 'INHERITANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'LOST', 'CLOSED_WON');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('DISCOVERY', 'QUALIFICATION', 'PRESENTATION', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST', 'CLOSED_CANCELLED');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF_MARKET');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'OFFICE', 'SHOP', 'LAND', 'WAREHOUSE', 'BUILDING');

-- CreateEnum
CREATE TYPE "PropertyListingType" AS ENUM ('SALE', 'RENT', 'LEASE');

-- CreateEnum
CREATE TYPE "PropertyCondition" AS ENUM ('NEW', 'GOOD', 'NEEDS_RENOVATION', 'UNDER_CONSTRUCTION');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('FREEHOLD', 'LEASEHOLD');

-- CreateEnum
CREATE TYPE "ZoningType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED');

-- CreateEnum
CREATE TYPE "RentalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "MaintenanceResponsibility" AS ENUM ('OWNER', 'TENANT', 'SHARED');

-- CreateEnum
CREATE TYPE "PropertySource" AS ENUM ('MANUAL', 'WEBSITE', 'WHATSAPP', 'REFERRAL');

-- CreateEnum
CREATE TYPE "PropertyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'SITE_VISIT', 'NOTE', 'OFFER');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OfferAction" AS ENUM ('OFFER_CREATED', 'PRICE_UPDATED', 'STATUS_CHANGED', 'COUNTER_OFFER', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'OFFER_WITHDRAWN');

-- CreateEnum
CREATE TYPE "OffererType" AS ENUM ('AGENCY', 'BUYER');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "ownerId" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT 'EMERALD',
    "defaultTheme" "OrganizationTheme" NOT NULL DEFAULT 'LIGHT',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "globalRole" "GlobalRole" NOT NULL DEFAULT 'USER',
    "unitPreference" "UnitPreference" NOT NULL DEFAULT 'METRIC',
    "phone" TEXT,
    "completedTutorials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dashboardConfig" JSONB,
    "preferredTheme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" "Permission"[],
    "level" INTEGER NOT NULL DEFAULT 1,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customRoleId" TEXT,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customRoleId" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "type" "ContactType" NOT NULL,
    "leadSource" TEXT,
    "assignedAgentId" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContactedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "minBudget" DECIMAL(65,30),
    "maxBudget" DECIMAL(65,30),
    "financingType" "FinancingType",
    "preApproved" BOOLEAN NOT NULL DEFAULT false,
    "preApprovedAmount" DECIMAL(65,30),
    "downPayment" DECIMAL(65,30),
    "propertyTypes" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],
    "minBedrooms" INTEGER,
    "minBathrooms" DOUBLE PRECISION,
    "minArea" DOUBLE PRECISION,
    "maxArea" DOUBLE PRECISION,
    "preferredCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredNeighborhoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parkingRequired" BOOLEAN NOT NULL DEFAULT false,
    "gardenRequired" BOOLEAN NOT NULL DEFAULT false,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "newConstruction" BOOLEAN NOT NULL DEFAULT false,
    "buyingTimeline" "BuyingTimeline",
    "purchasePurpose" "PurchasePurpose",
    "intent" "PropertyListingType" NOT NULL DEFAULT 'SALE',
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "urgencyLevel" "UrgencyLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "minimumPrice" DECIMAL(65,30),
    "mortgageBalance" DECIMAL(65,30),
    "listingType" "ListingType",
    "readyToList" BOOLEAN NOT NULL DEFAULT false,
    "occupied" BOOLEAN NOT NULL DEFAULT false,
    "tenantLeaseEndDate" TIMESTAMP(3),
    "sellingTimeline" "SellingTimeline",
    "reasonForSelling" "ReasonForSelling",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "budget" DECIMAL(65,30),
    "convertedAt" TIMESTAMP(3),
    "convertedContactId" TEXT,
    "notes" TEXT,
    "preferredLocation" TEXT,
    "propertyType" "PropertyType",
    "intent" "PropertyListingType" NOT NULL DEFAULT 'SALE',
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "urgencyLevel" "UrgencyLevel",

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "PropertyType" NOT NULL DEFAULT 'HOUSE',
    "listingType" "PropertyListingType",
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "referenceCode" TEXT,
    "createdById" TEXT,
    "address" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "state" TEXT,
    "governorate" TEXT,
    "district" TEXT,
    "street" TEXT,
    "buildingName" TEXT,
    "floor" TEXT,
    "unitNumber" TEXT,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sizeSqm" DOUBLE PRECISION,
    "landSizeSqm" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "lotSize" DOUBLE PRECISION,
    "livingRooms" INTEGER,
    "kitchens" INTEGER,
    "parkingSpaces" INTEGER,
    "floorNumber" INTEGER,
    "totalFloors" INTEGER,
    "yearBuilt" INTEGER,
    "condition" "PropertyCondition",
    "furnished" BOOLEAN DEFAULT false,
    "price" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "negotiable" BOOLEAN DEFAULT false,
    "pricePerSqm" DECIMAL(65,30),
    "commissionBuyerPercent" DOUBLE PRECISION,
    "commissionSellerPercent" DOUBLE PRECISION,
    "paymentTerms" JSONB,
    "rentalPeriod" "RentalPeriod",
    "rentAmount" DECIMAL(65,30),
    "paymentFrequency" "PaymentFrequency",
    "advancePaymentMonths" INTEGER,
    "securityDeposit" DECIMAL(65,30),
    "minLeaseDurationMonths" INTEGER,
    "maxLeaseDurationMonths" INTEGER,
    "utilitiesIncluded" BOOLEAN DEFAULT false,
    "availableFrom" TIMESTAMP(3),
    "renewalTerms" TEXT,
    "leaseTermYears" INTEGER,
    "rentEscalation" TEXT,
    "fitOutPeriod" TEXT,
    "serviceCharges" DECIMAL(65,30),
    "insuranceRequired" BOOLEAN DEFAULT false,
    "maintenanceResponsibility" "MaintenanceResponsibility",
    "ownerName" TEXT,
    "ownerContactId" TEXT,
    "ownershipType" "OwnershipType",
    "titleDeedAvailable" BOOLEAN DEFAULT false,
    "zoningType" "ZoningType",
    "legalNotes" TEXT,
    "features" TEXT[],
    "assignedUserId" TEXT,
    "sellerProfileId" TEXT,
    "source" "PropertySource",
    "listingDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "priority" "PropertyPriority",
    "propertyTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "inquiriesCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferNegotiation" (
    "id" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "deposit" DECIMAL(65,30),
    "financingType" "FinancingType" NOT NULL,
    "closingDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "status" "OfferStatus" NOT NULL,
    "notes" TEXT,
    "negotiationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerer" "OffererType" NOT NULL DEFAULT 'BUYER',
    "type" "DealType" NOT NULL DEFAULT 'SALE',
    "buyerCommission" DECIMAL(65,30),
    "sellerCommission" DECIMAL(65,30),
    "agentCommission" DECIMAL(65,30),

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferHistory" (
    "id" TEXT NOT NULL,
    "action" "OfferAction" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "offerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offerer" "OffererType",

    CONSTRAINT "OfferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(65,30),
    "stage" "DealStage" NOT NULL DEFAULT 'DISCOVERY',
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "propertyId" TEXT,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "DealType" NOT NULL DEFAULT 'SALE',
    "propertyPrice" DECIMAL(65,30),
    "rentPrice" DECIMAL(65,30),
    "buyerCommission" DECIMAL(65,30),
    "sellerCommission" DECIMAL(65,30),
    "totalCommission" DECIMAL(65,30),
    "agentCommission" DECIMAL(65,30),
    "isAgentPaid" BOOLEAN NOT NULL DEFAULT false,
    "agentPaidAt" TIMESTAMP(3),

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL DEFAULT 'NOTE',
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "calendarEventId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "CalendarEventType" NOT NULL DEFAULT 'MEETING',
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityTag" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "propertyId" TEXT,
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyFeature" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rentBuyerValue" DOUBLE PRECISION,
    "rentBuyerType" "CommissionType" NOT NULL DEFAULT 'MULTIPLIER',
    "rentSellerValue" DOUBLE PRECISION,
    "rentSellerType" "CommissionType" NOT NULL DEFAULT 'MULTIPLIER',
    "rentAgentValue" DOUBLE PRECISION,
    "rentAgentType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "saleBuyerValue" DOUBLE PRECISION,
    "saleBuyerType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "saleSellerValue" DOUBLE PRECISION,
    "saleSellerType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "saleAgentValue" DOUBLE PRECISION,
    "saleAgentType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "paymentTiming" TEXT,
    "paymentMethod" TEXT,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCommissionConfig" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rentAgentValue" DOUBLE PRECISION,
    "rentAgentType" "CommissionType",
    "saleAgentValue" DOUBLE PRECISION,
    "saleAgentType" "CommissionType",
    "monthlyTarget" DECIMAL(65,30),

    CONSTRAINT "AgentCommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealCommissionOverride" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "buyerCommission" DECIMAL(65,30),
    "sellerCommission" DECIMAL(65,30),
    "agentCommission" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "DealCommissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" DECIMAL(65,30) NOT NULL,
    "priceYearly" DECIMAL(65,30),
    "maxSeats" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAddon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSubscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "usedSeats" INTEGER NOT NULL DEFAULT 0,
    "trialStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndDate" TIMESTAMP(3) NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionAddon" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_id_idx" ON "Organization"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_assignedAgentId_idx" ON "Contact"("assignedAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_contactId_key" ON "BuyerProfile"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_contactId_key" ON "SellerProfile"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_convertedContactId_key" ON "Lead"("convertedContactId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");

-- CreateIndex
CREATE INDEX "Lead_assignedUserId_idx" ON "Lead"("assignedUserId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_referenceCode_key" ON "Property"("referenceCode");

-- CreateIndex
CREATE INDEX "Property_organizationId_idx" ON "Property"("organizationId");

-- CreateIndex
CREATE INDEX "Property_referenceCode_idx" ON "Property"("referenceCode");

-- CreateIndex
CREATE INDEX "Property_listingType_idx" ON "Property"("listingType");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

-- CreateIndex
CREATE INDEX "OfferNegotiation_organizationId_idx" ON "OfferNegotiation"("organizationId");

-- CreateIndex
CREATE INDEX "OfferNegotiation_propertyId_idx" ON "OfferNegotiation"("propertyId");

-- CreateIndex
CREATE INDEX "OfferNegotiation_contactId_idx" ON "OfferNegotiation"("contactId");

-- CreateIndex
CREATE INDEX "Offer_organizationId_idx" ON "Offer"("organizationId");

-- CreateIndex
CREATE INDEX "Offer_createdById_idx" ON "Offer"("createdById");

-- CreateIndex
CREATE INDEX "Offer_negotiationId_idx" ON "Offer"("negotiationId");

-- CreateIndex
CREATE INDEX "OfferHistory_offerId_idx" ON "OfferHistory"("offerId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_idx" ON "Deal"("organizationId");

-- CreateIndex
CREATE INDEX "Deal_assignedUserId_idx" ON "Deal"("assignedUserId");

-- CreateIndex
CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_calendarEventId_key" ON "Task"("calendarEventId");

-- CreateIndex
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");

-- CreateIndex
CREATE INDEX "Task_assignedUserId_idx" ON "Task"("assignedUserId");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "CalendarEvent_organizationId_idx" ON "CalendarEvent"("organizationId");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_endTime_idx" ON "CalendarEvent"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "Note_organizationId_idx" ON "Note"("organizationId");

-- CreateIndex
CREATE INDEX "File_organizationId_idx" ON "File"("organizationId");

-- CreateIndex
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_organizationId_name_key" ON "Tag"("organizationId", "name");

-- CreateIndex
CREATE INDEX "EntityTag_tagId_idx" ON "EntityTag"("tagId");

-- CreateIndex
CREATE INDEX "EntityTag_contactId_idx" ON "EntityTag"("contactId");

-- CreateIndex
CREATE INDEX "EntityTag_leadId_idx" ON "EntityTag"("leadId");

-- CreateIndex
CREATE INDEX "EntityTag_propertyId_idx" ON "EntityTag"("propertyId");

-- CreateIndex
CREATE INDEX "EntityTag_dealId_idx" ON "EntityTag"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_name_key" ON "Feature"("name");

-- CreateIndex
CREATE INDEX "PropertyFeature_propertyId_idx" ON "PropertyFeature"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyFeature_featureId_idx" ON "PropertyFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyFeature_propertyId_featureId_key" ON "PropertyFeature"("propertyId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionConfig_organizationId_key" ON "CommissionConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentCommissionConfig_agentId_key" ON "AgentCommissionConfig"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "DealCommissionOverride_dealId_key" ON "DealCommissionOverride"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSubscription_organizationId_key" ON "OrganizationSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "SubscriptionAddon_subscriptionId_idx" ON "SubscriptionAddon"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionAddon_subscriptionId_addonId_key" ON "SubscriptionAddon"("subscriptionId", "addonId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedContactId_fkey" FOREIGN KEY ("convertedContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerContactId_fkey" FOREIGN KEY ("ownerContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferNegotiation" ADD CONSTRAINT "OfferNegotiation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferNegotiation" ADD CONSTRAINT "OfferNegotiation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferNegotiation" ADD CONSTRAINT "OfferNegotiation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferNegotiation" ADD CONSTRAINT "OfferNegotiation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferNegotiation" ADD CONSTRAINT "OfferNegotiation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "OfferNegotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferHistory" ADD CONSTRAINT "OfferHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferHistory" ADD CONSTRAINT "OfferHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTag" ADD CONSTRAINT "EntityTag_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTag" ADD CONSTRAINT "EntityTag_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTag" ADD CONSTRAINT "EntityTag_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTag" ADD CONSTRAINT "EntityTag_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityTag" ADD CONSTRAINT "EntityTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFeature" ADD CONSTRAINT "PropertyFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFeature" ADD CONSTRAINT "PropertyFeature_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionConfig" ADD CONSTRAINT "CommissionConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommissionConfig" ADD CONSTRAINT "AgentCommissionConfig_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCommissionOverride" ADD CONSTRAINT "DealCommissionOverride_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionAddon" ADD CONSTRAINT "SubscriptionAddon_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionAddon" ADD CONSTRAINT "SubscriptionAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "PlanAddon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
