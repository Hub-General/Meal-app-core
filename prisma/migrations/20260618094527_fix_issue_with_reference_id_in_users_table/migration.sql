/*
  Warnings:

  - You are about to drop the column `referenceID` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referenceId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceId` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "referenceID",
ADD COLUMN     "referenceId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Users_referenceId_key" ON "Users"("referenceId");
