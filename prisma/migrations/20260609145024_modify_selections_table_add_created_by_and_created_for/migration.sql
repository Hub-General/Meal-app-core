/*
  Warnings:

  - You are about to drop the column `userId` on the `Selections` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[createdBy,weekMenuScheduleId,menuDayId]` on the table `Selections` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `Selections` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Selections" DROP CONSTRAINT "Selections_userId_fkey";

-- DropIndex
DROP INDEX "Selections_userId_weekMenuScheduleId_menuDayId_key";

-- DropIndex
DROP INDEX "idx_user_week_selection";

-- AlterTable
ALTER TABLE "Selections" DROP COLUMN "userId",
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "createdFor" INTEGER;

-- CreateIndex
CREATE INDEX "idx_user_week_selection" ON "Selections"("createdBy", "weekMenuScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Selections_createdBy_weekMenuScheduleId_menuDayId_key" ON "Selections"("createdBy", "weekMenuScheduleId", "menuDayId");

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_createdFor_fkey" FOREIGN KEY ("createdFor") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
