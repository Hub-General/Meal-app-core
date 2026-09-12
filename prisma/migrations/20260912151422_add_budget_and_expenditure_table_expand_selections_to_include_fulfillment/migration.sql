-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'FULFILLED', 'NOT_FULFILLED');

-- CreateEnum
CREATE TYPE "ExpenditureType" AS ENUM ('MEAL');

-- AlterEnum
ALTER TYPE "SelectionStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Selections" ADD COLUMN     "fulfilledAt" TIMESTAMP(3),
ADD COLUMN     "fulfillmentNote" TEXT,
ADD COLUMN     "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startPeriod" TIMESTAMP(3) NOT NULL,
    "endPeriod" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenditurePeriod" (
    "id" SERIAL NOT NULL,
    "type" "ExpenditureType" NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenditurePeriod_pkey" PRIMARY KEY ("id")
);
