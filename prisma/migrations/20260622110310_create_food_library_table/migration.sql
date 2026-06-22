-- CreateEnum
CREATE TYPE "FoodGroup" AS ENUM ('SUPERGROUP', 'BASE', 'PROTEIN', 'PREP');

-- CreateTable
CREATE TABLE "FoodLibrary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "foodCode" TEXT NOT NULL,
    "foodGroup" "FoodGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodLibrary_foodCode_foodGroup_key" ON "FoodLibrary"("foodCode", "foodGroup");
