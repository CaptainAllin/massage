-- AlterTable appointments: add needsReassignment flag for staff offboarding
ALTER TABLE "appointments" ADD COLUMN "needsReassignment" BOOLEAN NOT NULL DEFAULT false;
