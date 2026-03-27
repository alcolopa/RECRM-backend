-- CreateEnum: PropertyListingType
CREATE TYPE "PropertyListingType" AS ENUM ('SALE', 'RENT', 'LEASE');

-- CreateEnum: PropertyCondition
CREATE TYPE "PropertyCondition" AS ENUM ('NEW', 'GOOD', 'NEEDS_RENOVATION', 'UNDER_CONSTRUCTION');

-- CreateEnum: OwnershipType
CREATE TYPE "OwnershipType" AS ENUM ('FREEHOLD', 'LEASEHOLD');

-- CreateEnum: ZoningType
CREATE TYPE "ZoningType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED');

-- CreateEnum: RentalPeriod
CREATE TYPE "RentalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum: PaymentFrequency
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum: MaintenanceResponsibility
CREATE TYPE "MaintenanceResponsibility" AS ENUM ('OWNER', 'TENANT', 'SHARED');

-- CreateEnum: PropertySource
CREATE TYPE "PropertySource" AS ENUM ('MANUAL', 'WEBSITE', 'WHATSAPP', 'REFERRAL');

-- CreateEnum: PropertyPriority
CREATE TYPE "PropertyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum: PropertyStatus - rename UNDER_CONTRACT -> RESERVED
ALTER TYPE "PropertyStatus" RENAME VALUE 'UNDER_CONTRACT' TO 'RESERVED';

-- AlterEnum: PropertyType - migrate old values and replace
-- Step 1: Migrate existing data using removed values to closest match
UPDATE "Property" SET "type" = 'APARTMENT' WHERE "type" IN ('CONDO', 'TOWNHOUSE');
UPDATE "Property" SET "type" = 'OFFICE' WHERE "type" IN ('COMMERCIAL', 'RETAIL', 'INDUSTRIAL');
UPDATE "BuyerProfile" SET "propertyTypes" = array_remove("propertyTypes", 'CONDO'::"PropertyType");
UPDATE "BuyerProfile" SET "propertyTypes" = array_remove("propertyTypes", 'TOWNHOUSE'::"PropertyType");
UPDATE "BuyerProfile" SET "propertyTypes" = array_remove("propertyTypes", 'COMMERCIAL'::"PropertyType");
UPDATE "BuyerProfile" SET "propertyTypes" = array_remove("propertyTypes", 'RETAIL'::"PropertyType");
UPDATE "BuyerProfile" SET "propertyTypes" = array_remove("propertyTypes", 'INDUSTRIAL'::"PropertyType");
UPDATE "Lead" SET "propertyType" = 'APARTMENT' WHERE "propertyType" IN ('CONDO', 'TOWNHOUSE');
UPDATE "Lead" SET "propertyType" = 'OFFICE' WHERE "propertyType" IN ('COMMERCIAL', 'RETAIL', 'INDUSTRIAL');

-- Step 2: Create new enum, migrate columns, drop old enum
CREATE TYPE "PropertyType_new" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'OFFICE', 'SHOP', 'LAND', 'WAREHOUSE', 'BUILDING');

ALTER TABLE "Property" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Property" ALTER COLUMN "type" TYPE "PropertyType_new" USING "type"::text::"PropertyType_new";
ALTER TABLE "Property" ALTER COLUMN "type" SET DEFAULT 'HOUSE';

ALTER TABLE "BuyerProfile" ALTER COLUMN "propertyTypes" DROP DEFAULT;
ALTER TABLE "BuyerProfile" ALTER COLUMN "propertyTypes" TYPE "PropertyType_new"[] USING "propertyTypes"::text::"PropertyType_new"[];
ALTER TABLE "BuyerProfile" ALTER COLUMN "propertyTypes" SET DEFAULT ARRAY[]::"PropertyType_new"[];

ALTER TABLE "Lead" ALTER COLUMN "propertyType" TYPE "PropertyType_new" USING "propertyType"::text::"PropertyType_new";

DROP TYPE "PropertyType";
ALTER TYPE "PropertyType_new" RENAME TO "PropertyType";

-- AlterTable: Property - add new columns
ALTER TABLE "Property" ADD COLUMN "listingType" "PropertyListingType";
ALTER TABLE "Property" ADD COLUMN "referenceCode" TEXT;
ALTER TABLE "Property" ADD COLUMN "createdById" TEXT;

-- Location fields
ALTER TABLE "Property" ADD COLUMN "district" TEXT;
ALTER TABLE "Property" ADD COLUMN "street" TEXT;
ALTER TABLE "Property" ADD COLUMN "buildingName" TEXT;
ALTER TABLE "Property" ADD COLUMN "floor" TEXT;
ALTER TABLE "Property" ADD COLUMN "unitNumber" TEXT;
ALTER TABLE "Property" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Specification fields
ALTER TABLE "Property" ADD COLUMN "sizeSqm" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "landSizeSqm" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "livingRooms" INTEGER;
ALTER TABLE "Property" ADD COLUMN "kitchens" INTEGER;
ALTER TABLE "Property" ADD COLUMN "parkingSpaces" INTEGER;
ALTER TABLE "Property" ADD COLUMN "floorNumber" INTEGER;
ALTER TABLE "Property" ADD COLUMN "totalFloors" INTEGER;
ALTER TABLE "Property" ADD COLUMN "condition" "PropertyCondition";
ALTER TABLE "Property" ADD COLUMN "furnished" BOOLEAN DEFAULT false;

-- Pricing (common)
ALTER TABLE "Property" ADD COLUMN "currency" TEXT DEFAULT 'USD';
ALTER TABLE "Property" ADD COLUMN "negotiable" BOOLEAN DEFAULT false;

-- Pricing (sale)
ALTER TABLE "Property" ADD COLUMN "pricePerSqm" DECIMAL(65,30);
ALTER TABLE "Property" ADD COLUMN "commissionBuyerPercent" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "commissionSellerPercent" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "paymentTerms" JSONB;

-- Pricing (rent)
ALTER TABLE "Property" ADD COLUMN "rentalPeriod" "RentalPeriod";
ALTER TABLE "Property" ADD COLUMN "rentAmount" DECIMAL(65,30);
ALTER TABLE "Property" ADD COLUMN "paymentFrequency" "PaymentFrequency";
ALTER TABLE "Property" ADD COLUMN "advancePaymentMonths" INTEGER;
ALTER TABLE "Property" ADD COLUMN "securityDeposit" DECIMAL(65,30);
ALTER TABLE "Property" ADD COLUMN "minLeaseDurationMonths" INTEGER;
ALTER TABLE "Property" ADD COLUMN "maxLeaseDurationMonths" INTEGER;
ALTER TABLE "Property" ADD COLUMN "utilitiesIncluded" BOOLEAN DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "availableFrom" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN "renewalTerms" TEXT;

-- Pricing (lease / commercial)
ALTER TABLE "Property" ADD COLUMN "leaseTermYears" INTEGER;
ALTER TABLE "Property" ADD COLUMN "rentEscalation" TEXT;
ALTER TABLE "Property" ADD COLUMN "fitOutPeriod" TEXT;
ALTER TABLE "Property" ADD COLUMN "serviceCharges" DECIMAL(65,30);
ALTER TABLE "Property" ADD COLUMN "insuranceRequired" BOOLEAN DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "maintenanceResponsibility" "MaintenanceResponsibility";

-- Legal & Ownership
ALTER TABLE "Property" ADD COLUMN "ownerName" TEXT;
ALTER TABLE "Property" ADD COLUMN "ownerContactId" TEXT;
ALTER TABLE "Property" ADD COLUMN "ownershipType" "OwnershipType";
ALTER TABLE "Property" ADD COLUMN "titleDeedAvailable" BOOLEAN DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "zoningType" "ZoningType";
ALTER TABLE "Property" ADD COLUMN "legalNotes" TEXT;

-- CRM fields
ALTER TABLE "Property" ADD COLUMN "source" "PropertySource";
ALTER TABLE "Property" ADD COLUMN "listingDate" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN "expiryDate" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN "priority" "PropertyPriority";
ALTER TABLE "Property" ADD COLUMN "propertyTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Activity tracking
ALTER TABLE "Property" ADD COLUMN "viewsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Property" ADD COLUMN "inquiriesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Property" ADD COLUMN "lastViewedAt" TIMESTAMP(3);

-- Indexes
CREATE UNIQUE INDEX "Property_referenceCode_key" ON "Property"("referenceCode");
CREATE INDEX "Property_referenceCode_idx" ON "Property"("referenceCode");
CREATE INDEX "Property_listingType_idx" ON "Property"("listingType");
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- Foreign keys
ALTER TABLE "Property" ADD CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerContactId_fkey" FOREIGN KEY ("ownerContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
