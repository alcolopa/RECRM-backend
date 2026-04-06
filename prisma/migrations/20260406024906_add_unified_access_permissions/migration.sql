-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'LEADS_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE 'CONTACTS_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE 'PROPERTIES_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE 'DEALS_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE 'OFFERS_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE 'PAYOUTS_VIEW_ALL';
ALTER TYPE "Permission" ADD VALUE 'DASHBOARD_VIEW_ALL';
