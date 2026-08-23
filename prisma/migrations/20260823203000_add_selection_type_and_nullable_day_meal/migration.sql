-- CreateEnum
CREATE TYPE "SelectionType" AS ENUM ('MEAL', 'UNAVAILABLE', 'HOLIDAY');

-- DropForeignKey
ALTER TABLE "Selections" DROP CONSTRAINT "Selections_dayMealId_fkey";

-- AlterTable
ALTER TABLE "Selections" ALTER COLUMN "dayMealId" DROP NOT NULL,
ADD COLUMN "selectionType" "SelectionType" NOT NULL DEFAULT 'MEAL';

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_dayMealId_fkey" FOREIGN KEY ("dayMealId") REFERENCES "MenuDayMeals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
