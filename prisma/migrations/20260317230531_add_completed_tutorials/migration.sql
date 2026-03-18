-- AlterTable
ALTER TABLE "User" ADD COLUMN     "completedTutorials" TEXT[] DEFAULT ARRAY[]::TEXT[];
