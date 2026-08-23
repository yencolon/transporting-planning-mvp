-- A unit is a real vehicle: two rows with the same name would make the duty
-- assignment ambiguous. Backstops the check in CreateUnit.
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");
