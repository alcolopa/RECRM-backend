-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PropertyType" ADD VALUE 'CONDO';
ALTER TYPE "PropertyType" ADD VALUE 'TOWNHOUSE';
ALTER TYPE "PropertyType" ADD VALUE 'INDUSTRIAL';

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "country" TEXT,
ADD COLUMN     "governorate" TEXT;

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyFeature" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,

    CONSTRAINT "PropertyFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_name_key" ON "Feature"("name");

-- CreateIndex
CREATE INDEX "PropertyFeature_propertyId_idx" ON "PropertyFeature"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyFeature_featureId_idx" ON "PropertyFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyFeature_propertyId_featureId_key" ON "PropertyFeature"("propertyId", "featureId");

-- AddForeignKey
ALTER TABLE "PropertyFeature" ADD CONSTRAINT "PropertyFeature_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFeature" ADD CONSTRAINT "PropertyFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
