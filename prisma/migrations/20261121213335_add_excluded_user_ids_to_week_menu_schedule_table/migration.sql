-- AlterTable
ALTER TABLE "WeekMenuSchedule" ADD COLUMN     "excludedUserIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
