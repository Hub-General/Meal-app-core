/*
  Warnings:

  - Added the required column `menuId` to the `Presets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presets" ADD COLUMN     "menuId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Presets" ADD CONSTRAINT "Presets_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
