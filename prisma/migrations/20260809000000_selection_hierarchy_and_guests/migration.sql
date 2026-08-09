-- Make anonymous guest quantities explicit while preserving all existing selections.
ALTER TABLE "Selections" ADD COLUMN "guestCount" INTEGER NOT NULL DEFAULT 1;

-- A meal choice belongs to its recipient, rather than to the user who created it.
DROP INDEX "Selections_createdBy_weekMenuScheduleId_menuDayId_key";
CREATE UNIQUE INDEX "Selections_createdFor_weekMenuScheduleId_menuDayId_key"
ON "Selections"("createdFor", "weekMenuScheduleId", "menuDayId");

DROP INDEX "idx_user_week_selection";
CREATE INDEX "idx_user_week_selection"
ON "Selections"("createdFor", "weekMenuScheduleId");