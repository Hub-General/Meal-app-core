/*
  Warnings:

  - Added the required column `selectionStatus` to the `Selections` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SelectionStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- AlterTable
ALTER TABLE "Selections" ADD COLUMN     "selectionStatus" "SelectionStatus" NOT NULL;
