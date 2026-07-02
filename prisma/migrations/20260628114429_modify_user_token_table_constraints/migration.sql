/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `UserTokens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserTokens" ALTER COLUMN "usedAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserTokens_userId_type_key" ON "UserTokens"("userId", "type");
