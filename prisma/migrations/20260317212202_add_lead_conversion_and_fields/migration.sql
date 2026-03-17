/*
  Warnings:

  - A unique constraint covering the columns `[convertedContactId]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "budget" DECIMAL(65,30),
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "convertedContactId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preferredLocation" TEXT,
ADD COLUMN     "propertyType" "PropertyType";

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "offerer" TEXT;

-- AlterTable
ALTER TABLE "OfferHistory" ADD COLUMN     "offerer" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_convertedContactId_key" ON "Lead"("convertedContactId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedContactId_fkey" FOREIGN KEY ("convertedContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
