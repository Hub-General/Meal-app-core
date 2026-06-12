-- CreateEnum
CREATE TYPE "Days" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "Roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menus" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuDays" (
    "id" SERIAL NOT NULL,
    "menuId" INTEGER NOT NULL,
    "day" "Days" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuDays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuDayMeals" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "menuDayId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,

    CONSTRAINT "MenuDayMeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meals" (
    "id" SERIAL NOT NULL,
    "image" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "foodCode" TEXT NOT NULL,
    "calories" INTEGER,

    CONSTRAINT "Meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Selections" (
    "id" SERIAL NOT NULL,
    "dayMealId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presets" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "selectionId" INTEGER NOT NULL,

    CONSTRAINT "Presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taste_profiles" (
    "user_id" UUID NOT NULL,
    "calendar_year" INTEGER NOT NULL,
    "total_meals_selected" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "personality_type" VARCHAR(50),
    "favorite_protein" VARCHAR(5),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taste_profiles_pkey" PRIMARY KEY ("user_id","calendar_year")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Meals_foodCode_key" ON "Meals"("foodCode");

-- CreateIndex
CREATE INDEX "idx_taste_profiles_filters" ON "taste_profiles"("calendar_year", "personality_type", "favorite_protein");

-- CreateIndex
CREATE INDEX "idx_total_meals" ON "taste_profiles"("total_meals_selected");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDays" ADD CONSTRAINT "MenuDays_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDayMeals" ADD CONSTRAINT "MenuDayMeals_menuDayId_fkey" FOREIGN KEY ("menuDayId") REFERENCES "MenuDays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuDayMeals" ADD CONSTRAINT "MenuDayMeals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_dayMealId_fkey" FOREIGN KEY ("dayMealId") REFERENCES "MenuDayMeals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selections" ADD CONSTRAINT "Selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presets" ADD CONSTRAINT "Presets_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "Selections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
