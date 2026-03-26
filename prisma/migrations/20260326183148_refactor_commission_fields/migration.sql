/*
  Warnings:

  - You are about to drop the column `rentAgentShare` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentBuyerMonths` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentSellerMonths` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleAgentPercent` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleBuyerPercent` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleSellerPercent` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentAgentMaxShare` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentAgentMinShare` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentBuyerMonths` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentSellerMonths` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleAgentMaxPercent` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleAgentMinPercent` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleBuyerPercent` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleSellerPercent` on the `CommissionConfig` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED', 'MULTIPLIER');

-- AlterTable
ALTER TABLE "AgentCommissionConfig" DROP COLUMN "rentAgentShare",
DROP COLUMN "rentBuyerMonths",
DROP COLUMN "rentSellerMonths",
DROP COLUMN "saleAgentPercent",
DROP COLUMN "saleBuyerPercent",
DROP COLUMN "saleSellerPercent",
ADD COLUMN     "rentAgentType" "CommissionType",
ADD COLUMN     "rentAgentValue" DOUBLE PRECISION,
ADD COLUMN     "rentBuyerType" "CommissionType",
ADD COLUMN     "rentBuyerValue" DOUBLE PRECISION,
ADD COLUMN     "rentSellerType" "CommissionType",
ADD COLUMN     "rentSellerValue" DOUBLE PRECISION,
ADD COLUMN     "saleAgentType" "CommissionType",
ADD COLUMN     "saleAgentValue" DOUBLE PRECISION,
ADD COLUMN     "saleBuyerType" "CommissionType",
ADD COLUMN     "saleBuyerValue" DOUBLE PRECISION,
ADD COLUMN     "saleSellerType" "CommissionType",
ADD COLUMN     "saleSellerValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CommissionConfig" DROP COLUMN "rentAgentMaxShare",
DROP COLUMN "rentAgentMinShare",
DROP COLUMN "rentBuyerMonths",
DROP COLUMN "rentSellerMonths",
DROP COLUMN "saleAgentMaxPercent",
DROP COLUMN "saleAgentMinPercent",
DROP COLUMN "saleBuyerPercent",
DROP COLUMN "saleSellerPercent",
ADD COLUMN     "rentAgentType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "rentAgentValue" DOUBLE PRECISION,
ADD COLUMN     "rentBuyerType" "CommissionType" NOT NULL DEFAULT 'MULTIPLIER',
ADD COLUMN     "rentBuyerValue" DOUBLE PRECISION,
ADD COLUMN     "rentSellerType" "CommissionType" NOT NULL DEFAULT 'MULTIPLIER',
ADD COLUMN     "rentSellerValue" DOUBLE PRECISION,
ADD COLUMN     "saleAgentType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "saleAgentValue" DOUBLE PRECISION,
ADD COLUMN     "saleBuyerType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "saleBuyerValue" DOUBLE PRECISION,
ADD COLUMN     "saleSellerType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "saleSellerValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "agentCommission" DECIMAL(65,30),
ADD COLUMN     "buyerCommission" DECIMAL(65,30),
ADD COLUMN     "sellerCommission" DECIMAL(65,30),
ADD COLUMN     "type" "DealType" NOT NULL DEFAULT 'SALE';
