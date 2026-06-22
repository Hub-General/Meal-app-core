/*
  Warnings:

  - Added the required column `referenceID` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "referenceID" INTEGER NOT NULL;
