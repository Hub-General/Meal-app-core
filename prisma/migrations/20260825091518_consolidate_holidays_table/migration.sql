/*
  Warnings:

  - You are about to drop the `CompanyHolidays` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HolidayOverrides` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('COMPANY', 'OVERRIDE');

-- DropTable
DROP TABLE "CompanyHolidays";

-- DropTable
DROP TABLE "HolidayOverrides";

-- CreateTable
CREATE TABLE "Holidays" (
    "id" SERIAL NOT NULL,
    "type" "HolidayType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "notes" TEXT,
    "originalDate" TEXT,
    "isIgnored" BOOLEAN NOT NULL DEFAULT false,
    "adjustedDate" TEXT,
    "adjustedDayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holidays_originalDate_key" ON "Holidays"("originalDate");

-- CreateIndex
CREATE INDEX "Holidays_year_idx" ON "Holidays"("year");

-- CreateIndex
CREATE INDEX "Holidays_year_type_idx" ON "Holidays"("year", "type");
