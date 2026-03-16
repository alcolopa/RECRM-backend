/*
  Warnings:

  - You are about to drop the column `assignedUserId` on the `Property` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_assignedUserId_fkey";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "assignedUserId";
