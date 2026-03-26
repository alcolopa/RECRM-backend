/*
  Warnings:

  - You are about to drop the column `rentBuyerType` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentBuyerValue` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentSellerType` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rentSellerValue` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleBuyerType` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleBuyerValue` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleSellerType` on the `AgentCommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `saleSellerValue` on the `AgentCommissionConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AgentCommissionConfig" DROP COLUMN "rentBuyerType",
DROP COLUMN "rentBuyerValue",
DROP COLUMN "rentSellerType",
DROP COLUMN "rentSellerValue",
DROP COLUMN "saleBuyerType",
DROP COLUMN "saleBuyerValue",
DROP COLUMN "saleSellerType",
DROP COLUMN "saleSellerValue";
