-- CreateEnum
CREATE TYPE "WeekMenuStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'CLOSED');

-- AlterTable
ALTER TABLE "WeekMenuSchedule" ADD COLUMN     "status" "WeekMenuStatus" NOT NULL DEFAULT 'DRAFT';
