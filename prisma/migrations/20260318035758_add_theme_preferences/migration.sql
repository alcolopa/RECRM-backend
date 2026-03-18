-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrganizationTheme" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "defaultTheme" "OrganizationTheme" NOT NULL DEFAULT 'LIGHT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredTheme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM';
