-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'PAYOUTS_VIEW';
ALTER TYPE "Permission" ADD VALUE 'PAYOUTS_MANAGE';

-- AlterTable
ALTER TABLE "AgentCommissionConfig" ADD COLUMN     "monthlyTarget" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "agentPaidAt" TIMESTAMP(3),
ADD COLUMN     "isAgentPaid" BOOLEAN NOT NULL DEFAULT false;
