-- Replace Duty.durationMinutes with an explicit Duty.endAt, preserving existing rows.
ALTER TABLE "Duty" ADD COLUMN "endAt" TIMESTAMP(3);

UPDATE "Duty" SET "endAt" = "startAt" + ("durationMinutes" * INTERVAL '1 minute');

ALTER TABLE "Duty" ALTER COLUMN "endAt" SET NOT NULL;

ALTER TABLE "Duty" DROP COLUMN "durationMinutes";

-- Route points may carry an optional label.
ALTER TABLE "RoutePoint" ADD COLUMN "name" TEXT;
