/*
  Warnings:

  - You are about to drop the column `selectionId` on the `Presets` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Users` table. All the data in the column will be lost.
  - The primary key for the `taste_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `taste_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[menuDayId,mealId]` on the table `MenuDayMeals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[menuId,day]` on the table `MenuDays` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,weekMenuScheduleId,menuDayId]` on the table `Selections` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Presets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menuDayId` to the `Selections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Selections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekMenuScheduleId` to the `Selections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `taste_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'RETIRED');

-- DropForeignKey
ALTER TABLE "Presets" DROP CONSTRAINT "Presets_selectionId_fkey";

-- AlterTable
ALTER TABLE "Presets" DROP COLUMN "selectionId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Selections" ADD COLUMN     "menuDayId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weekMenuScheduleId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "firstName",
DROP COLUMN "isActive",
DROP COLUMN "lastName",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "taste_profiles" DROP CONSTRAINT "taste_profiles_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "taste_profiles_pkey" PRIMARY KEY ("userId", "calendar_year");

-- CreateTable
CREATE TABLE "UserAvailability" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekMenuSchedule" (
    "id" SERIAL NOT NULL,
    "week" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,

    CONSTRAINT "WeekMenuSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresetItems" (
    "id" SERIAL NOT NULL,
    "presetId" INTEGER NOT NULL,
    "menuDayId" INTEGER NOT NULL,
    "dayMealId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresetItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAvailability_userId_idx" ON "UserAvailability"("userId");

-- CreateIndex
CREATE INDEX "UserAvailability_startDate_endDate_idx" ON "UserAvailability"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeekMenuSchedule_week_year_key" ON "WeekMenuSchedule"("week", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PresetItems_menuDayId_presetId_key" ON "PresetItems"("menuDayId", "presetId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuDayMeals_menuDayId_mealId_key" ON "MenuDayMeals"("menuDayId", "mealId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuDays_menuId_day_key" ON "MenuDays"("menuId", "day");

-- CreateIndex
CREATE INDEX "idx_user_week_selection" ON "Selections"("userId", "weekMenuScheduleId");

-- CreateIndex
CREATE INDEX "idx_week_selections" ON "Selections"("weekMenuScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Selections_userId_weekMenuScheduleId_menuDayId_key" ON "Selections"("userId", "weekMenuScheduleId", "menuDayId");

-- AddForeignKey
ALTER TABLE "UserAvailability" ADD CONSTRAINT "UserAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekMenuSchedule" ADD CONSTRAINT "WeekMenuSchedule_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_menuDayId_fkey" FOREIGN KEY ("menuDayId") REFERENCES "MenuDays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_weekMenuScheduleId_fkey" FOREIGN KEY ("weekMenuScheduleId") REFERENCES "WeekMenuSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presets" ADD CONSTRAINT "Presets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresetItems" ADD CONSTRAINT "PresetItems_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Presets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresetItems" ADD CONSTRAINT "PresetItems_menuDayId_fkey" FOREIGN KEY ("menuDayId") REFERENCES "MenuDays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresetItems" ADD CONSTRAINT "PresetItems_dayMealId_fkey" FOREIGN KEY ("dayMealId") REFERENCES "MenuDayMeals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_profiles" ADD CONSTRAINT "taste_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
