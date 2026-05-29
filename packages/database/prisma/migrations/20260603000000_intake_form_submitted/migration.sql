-- Add isSubmitted flag to intake_forms for INTAKE_FORM_NOT_COMPLETED trigger
ALTER TABLE "intake_forms" ADD COLUMN "isSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- Back-fill: mark existing forms that have _completed=true in formData as submitted
UPDATE "intake_forms" SET "isSubmitted" = true WHERE "formData"->>'_completed' = 'true';
