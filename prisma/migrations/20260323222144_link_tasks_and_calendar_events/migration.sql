/*
  Warnings:

  - A unique constraint covering the columns `[calendarEventId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "calendarEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_calendarEventId_key" ON "Task"("calendarEventId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
