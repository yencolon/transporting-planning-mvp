-- Backstop for the business rule enforced in the application layer:
-- one unit cannot hold two duties whose windows overlap.
-- The '[)' bound makes touching windows legal (one ends exactly when the next starts),
-- matching TimeWindow.overlaps in the domain layer.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Duty" ADD CONSTRAINT "Duty_unit_window_no_overlap"
  EXCLUDE USING gist ("unitId" WITH =, tsrange("startAt", "endAt", '[)') WITH &&);
