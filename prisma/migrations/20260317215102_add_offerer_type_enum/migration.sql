/*
  Warnings:

  - The `offerer` column on the `Offer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `offerer` column on the `OfferHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OffererType" AS ENUM ('AGENCY', 'BUYER');

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "offerer",
ADD COLUMN     "offerer" "OffererType" NOT NULL DEFAULT 'BUYER';

-- AlterTable
ALTER TABLE "OfferHistory" DROP COLUMN "offerer",
ADD COLUMN     "offerer" "OffererType";
