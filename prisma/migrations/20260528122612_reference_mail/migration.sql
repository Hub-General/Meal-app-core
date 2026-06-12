/*
  Warnings:

  - A unique constraint covering the columns `[referenceEmail]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceEmail` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "referenceEmail" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Users_referenceEmail_key" ON "Users"("referenceEmail");
