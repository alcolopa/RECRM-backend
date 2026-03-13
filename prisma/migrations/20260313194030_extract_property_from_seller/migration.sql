/*
  Warnings:

  - You are about to drop the column `area` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `expectedPrice` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `lotSize` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `propertyAddress` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `propertyType` on the `SellerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `yearBuilt` on the `SellerProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SellerProfile" DROP CONSTRAINT "SellerProfile_propertyId_fkey";

-- DropIndex
DROP INDEX "SellerProfile_propertyId_key";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "sellerProfileId" TEXT;

-- AlterTable
ALTER TABLE "SellerProfile" DROP COLUMN "area",
DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "expectedPrice",
DROP COLUMN "lotSize",
DROP COLUMN "propertyAddress",
DROP COLUMN "propertyId",
DROP COLUMN "propertyType",
DROP COLUMN "yearBuilt";

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
