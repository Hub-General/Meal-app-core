/*
  Warnings:

  - You are about to alter the column `menuId` on the `MenuDays` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - The primary key for the `Menus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Menus` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `menuId` on the `Presets` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - The primary key for the `Roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Roles` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `roleId` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `menuId` on the `WeekMenuSchedule` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.

*/
-- DropForeignKey
ALTER TABLE "MenuDays" DROP CONSTRAINT "MenuDays_menuId_fkey";

-- DropForeignKey
ALTER TABLE "Presets" DROP CONSTRAINT "Presets_menuId_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_roleId_fkey";

-- DropForeignKey
ALTER TABLE "WeekMenuSchedule" DROP CONSTRAINT "WeekMenuSchedule_menuId_fkey";

-- AlterTable
ALTER TABLE "MenuDays" ALTER COLUMN "menuId" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "Menus" DROP CONSTRAINT "Menus_pkey",
ADD COLUMN     "order" SMALLINT,
ALTER COLUMN "id" SET DATA TYPE SMALLINT,
ADD CONSTRAINT "Menus_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Presets" ALTER COLUMN "menuId" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "Roles" DROP CONSTRAINT "Roles_pkey",
ALTER COLUMN "id" SET DATA TYPE SMALLINT,
ADD CONSTRAINT "Roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "roleId" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "WeekMenuSchedule" ALTER COLUMN "menuId" SET DATA TYPE SMALLINT;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekMenuSchedule" ADD CONSTRAINT "WeekMenuSchedule_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDays" ADD CONSTRAINT "MenuDays_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presets" ADD CONSTRAINT "Presets_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
