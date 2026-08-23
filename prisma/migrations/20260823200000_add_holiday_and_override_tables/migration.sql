-- CreateTable
CREATE TABLE "CompanyHolidays" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCompany" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyHolidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayOverrides" (
    "id" SERIAL NOT NULL,
    "originalDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isIgnored" BOOLEAN NOT NULL DEFAULT false,
    "adjustedDate" TEXT,
    "adjustedDayName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolidayOverrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyHolidays_year_idx" ON "CompanyHolidays"("year");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayOverrides_originalDate_key" ON "HolidayOverrides"("originalDate");

-- CreateIndex
CREATE INDEX "HolidayOverrides_year_idx" ON "HolidayOverrides"("year");
