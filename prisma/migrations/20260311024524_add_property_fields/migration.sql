-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'LAND', 'COMMERCIAL', 'INDUSTRIAL');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "bathrooms" DOUBLE PRECISION,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "lotSize" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "type" "PropertyType" NOT NULL DEFAULT 'HOUSE',
ADD COLUMN     "yearBuilt" INTEGER,
ADD COLUMN     "zipCode" TEXT;
