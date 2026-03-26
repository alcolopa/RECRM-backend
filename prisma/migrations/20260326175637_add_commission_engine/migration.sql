-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('SALE', 'RENT');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "agentCommission" DECIMAL(65,30),
ADD COLUMN     "buyerCommission" DECIMAL(65,30),
ADD COLUMN     "propertyPrice" DECIMAL(65,30),
ADD COLUMN     "rentPrice" DECIMAL(65,30),
ADD COLUMN     "sellerCommission" DECIMAL(65,30),
ADD COLUMN     "totalCommission" DECIMAL(65,30),
ADD COLUMN     "type" "DealType" NOT NULL DEFAULT 'SALE';

-- CreateTable
CREATE TABLE "CommissionConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rentBuyerMonths" DOUBLE PRECISION,
    "rentSellerMonths" DOUBLE PRECISION,
    "rentAgentMinShare" DOUBLE PRECISION,
    "rentAgentMaxShare" DOUBLE PRECISION,
    "saleBuyerPercent" DOUBLE PRECISION,
    "saleSellerPercent" DOUBLE PRECISION,
    "saleAgentMinPercent" DOUBLE PRECISION,
    "saleAgentMaxPercent" DOUBLE PRECISION,
    "paymentTiming" TEXT,
    "paymentMethod" TEXT,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCommissionConfig" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rentBuyerMonths" DOUBLE PRECISION,
    "rentSellerMonths" DOUBLE PRECISION,
    "rentAgentShare" DOUBLE PRECISION,
    "saleBuyerPercent" DOUBLE PRECISION,
    "saleSellerPercent" DOUBLE PRECISION,
    "saleAgentPercent" DOUBLE PRECISION,

    CONSTRAINT "AgentCommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealCommissionOverride" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "buyerCommission" DECIMAL(65,30),
    "sellerCommission" DECIMAL(65,30),
    "agentCommission" DECIMAL(65,30),
    "notes" TEXT,

    CONSTRAINT "DealCommissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionConfig_organizationId_key" ON "CommissionConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentCommissionConfig_agentId_key" ON "AgentCommissionConfig"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "DealCommissionOverride_dealId_key" ON "DealCommissionOverride"("dealId");

-- AddForeignKey
ALTER TABLE "CommissionConfig" ADD CONSTRAINT "CommissionConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommissionConfig" ADD CONSTRAINT "AgentCommissionConfig_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCommissionOverride" ADD CONSTRAINT "DealCommissionOverride_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
