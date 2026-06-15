ALTER TABLE "allocation_rules" ADD COLUMN "type" "category_type";
UPDATE "allocation_rules" SET "type" = 'fixed_expenses';
ALTER TABLE "allocation_rules" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "allocation_rules" DROP COLUMN IF EXISTS "category_id";
DROP INDEX IF EXISTS "allocation_rules_categoryId_idx";
CREATE UNIQUE INDEX "allocation_rules_plan_type_idx" ON "allocation_rules" ("monthly_plan_id","type");
