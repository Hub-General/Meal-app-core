/*
  Warnings:

  - You are about to drop the column `image` on the `Meals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Meals" DROP COLUMN "image",
ADD COLUMN     "imagePath" TEXT;
