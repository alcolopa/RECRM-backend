-- CreateEnum
CREATE TYPE "UnitPreference" AS ENUM ('METRIC', 'IMPERIAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unitPreference" "UnitPreference" NOT NULL DEFAULT 'METRIC';
