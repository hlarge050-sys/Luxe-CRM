-- Seed: the nine job stages and the first real job on the books.
-- Idempotent on purpose: safe to run on any environment, any number of times.

INSERT INTO "job_stages" ("name", "position", "is_terminal") VALUES
  ('New enquiry', 1, false),
  ('Visit booked', 2, false),
  ('Takeoff done', 3, false),
  ('Quote sent', 4, false),
  ('Follow-up', 5, false),
  ('Accepted', 6, false),
  ('In progress', 7, false),
  ('Complete', 8, true),
  ('Lost', 9, true)
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "contacts" ("name", "address_line1", "town", "postcode", "source")
SELECT 'Matt Pickard', '10 Sea Spray Avenue', 'Shoreham-by-Sea', 'BN43 5PR', 'Historic, quote 00001'
WHERE NOT EXISTS (
  SELECT 1 FROM "contacts" WHERE "name" = 'Matt Pickard' AND "postcode" = 'BN43 5PR'
);
--> statement-breakpoint
INSERT INTO "jobs" ("reference", "contact_id", "title", "stage_id", "site_address_line1", "site_town", "site_postcode", "source", "stage_changed_at")
SELECT '00001', c."id", 'Garden landscaping, quote 00001', s."id", '10 Sea Spray Avenue', 'Shoreham-by-Sea', 'BN43 5PR', 'Historic, quote 00001', now()
FROM "contacts" c, "job_stages" s
WHERE c."name" = 'Matt Pickard' AND c."postcode" = 'BN43 5PR'
  AND s."name" = 'Complete'
  AND NOT EXISTS (SELECT 1 FROM "jobs" WHERE "reference" = '00001');
--> statement-breakpoint
INSERT INTO "activities" ("job_id", "kind", "body")
SELECT j."id", 'system', 'Seeded at M1 as the first quoted job on the books, reference 00001, July 2026.'
FROM "jobs" j
WHERE j."reference" = '00001'
  AND NOT EXISTS (
    SELECT 1 FROM "activities" a WHERE a."job_id" = j."id" AND a."kind" = 'system'
  );
