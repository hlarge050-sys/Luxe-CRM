-- Parked / waiting: the tenth stage, agreed at M2. Sits between Follow-up and
-- Accepted for jobs deliberately on hold (client gone quiet but warm, waiting
-- on planning, materials or a start date) so live work never masquerades as
-- dead. Idempotent like the other seeds: the renumber only runs while the
-- stage is absent, and the insert no-ops once it exists.

UPDATE "job_stages" SET "position" = "position" + 1
WHERE "position" >= 6
  AND NOT EXISTS (SELECT 1 FROM "job_stages" WHERE "name" = 'Parked / waiting');
--> statement-breakpoint
INSERT INTO "job_stages" ("name", "position", "is_terminal")
VALUES ('Parked / waiting', 6, false)
ON CONFLICT ("name") DO NOTHING;
