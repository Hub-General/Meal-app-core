-- Keep the oldest row when historical duplicate leave records exist.
DELETE FROM "UserAvailability" duplicate
USING "UserAvailability" original
WHERE duplicate."id" > original."id"
  AND duplicate."userId" = original."userId"
  AND duplicate."startDate" = original."startDate"
  AND duplicate."endDate" = original."endDate";

CREATE UNIQUE INDEX "UserAvailability_userId_startDate_endDate_key"
ON "UserAvailability"("userId", "startDate", "endDate");
