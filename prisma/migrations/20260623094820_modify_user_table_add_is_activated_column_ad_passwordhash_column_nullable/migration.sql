/*
  Warnings:

  - Added the required column `isActivated` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "isActivated" BOOLEAN NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;
