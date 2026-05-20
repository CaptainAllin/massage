-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST', 'CLIENT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "authProviderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "phoneNumber" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'USA',
    "website" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#A8C3A0',
    "secondaryColor" TEXT DEFAULT '#E7D8C9',
    "subscriptionTier" TEXT DEFAULT 'FREE',
    "subscriptionStatus" TEXT DEFAULT 'ACTIVE',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "hourlyRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "medicalHistory" JSONB,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryPhysician" TEXT,
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "occupation" TEXT,
    "goals" TEXT,
    "preferredTherapistId" TEXT,
    "lastVisitDate" TIMESTAMP(3),
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "serviceType" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_forms" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "templateId" TEXT,
    "formData" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_notes" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "subjectiveFindings" TEXT,
    "objectiveFindings" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "areasWorked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "techniques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionDuration" INTEGER,
    "followUpDate" TIMESTAMP(3),
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_form_templates" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_maps" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "treatmentNoteId" TEXT,
    "view" TEXT NOT NULL,
    "regions" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_notes" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_conditions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosisDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "severity" TEXT,
    "notes" TEXT,
    "treatmentPlan" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_authProviderId_key" ON "users"("authProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_authProviderId_idx" ON "users"("authProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_ownerId_key" ON "businesses"("ownerId");

-- CreateIndex
CREATE INDEX "businesses_ownerId_idx" ON "businesses"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_userId_key" ON "therapists"("userId");

-- CreateIndex
CREATE INDEX "therapists_userId_idx" ON "therapists"("userId");

-- CreateIndex
CREATE INDEX "therapists_businessId_idx" ON "therapists"("businessId");

-- CreateIndex
CREATE INDEX "therapists_isActive_idx" ON "therapists"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- CreateIndex
CREATE INDEX "clients_businessId_idx" ON "clients"("businessId");

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_phoneNumber_idx" ON "clients"("phoneNumber");

-- CreateIndex
CREATE INDEX "clients_isActive_idx" ON "clients"("isActive");

-- CreateIndex
CREATE INDEX "clients_preferredTherapistId_idx" ON "clients"("preferredTherapistId");

-- CreateIndex
CREATE INDEX "clients_lastVisitDate_idx" ON "clients"("lastVisitDate");

-- CreateIndex
CREATE INDEX "appointments_businessId_idx" ON "appointments"("businessId");

-- CreateIndex
CREATE INDEX "appointments_clientId_idx" ON "appointments"("clientId");

-- CreateIndex
CREATE INDEX "appointments_therapistId_idx" ON "appointments"("therapistId");

-- CreateIndex
CREATE INDEX "appointments_startTime_idx" ON "appointments"("startTime");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "intake_forms_businessId_idx" ON "intake_forms"("businessId");

-- CreateIndex
CREATE INDEX "intake_forms_clientId_idx" ON "intake_forms"("clientId");

-- CreateIndex
CREATE INDEX "intake_forms_templateId_idx" ON "intake_forms"("templateId");

-- CreateIndex
CREATE INDEX "intake_forms_submittedAt_idx" ON "intake_forms"("submittedAt");

-- CreateIndex
CREATE INDEX "treatment_notes_businessId_idx" ON "treatment_notes"("businessId");

-- CreateIndex
CREATE INDEX "treatment_notes_appointmentId_idx" ON "treatment_notes"("appointmentId");

-- CreateIndex
CREATE INDEX "treatment_notes_clientId_idx" ON "treatment_notes"("clientId");

-- CreateIndex
CREATE INDEX "treatment_notes_therapistId_idx" ON "treatment_notes"("therapistId");

-- CreateIndex
CREATE INDEX "treatment_notes_followUpDate_idx" ON "treatment_notes"("followUpDate");

-- CreateIndex
CREATE INDEX "intake_form_templates_businessId_idx" ON "intake_form_templates"("businessId");

-- CreateIndex
CREATE INDEX "intake_form_templates_isActive_idx" ON "intake_form_templates"("isActive");

-- CreateIndex
CREATE INDEX "intake_form_templates_isDefault_idx" ON "intake_form_templates"("isDefault");

-- CreateIndex
CREATE INDEX "body_maps_businessId_idx" ON "body_maps"("businessId");

-- CreateIndex
CREATE INDEX "body_maps_clientId_idx" ON "body_maps"("clientId");

-- CreateIndex
CREATE INDEX "body_maps_appointmentId_idx" ON "body_maps"("appointmentId");

-- CreateIndex
CREATE INDEX "body_maps_treatmentNoteId_idx" ON "body_maps"("treatmentNoteId");

-- CreateIndex
CREATE INDEX "body_maps_createdAt_idx" ON "body_maps"("createdAt");

-- CreateIndex
CREATE INDEX "therapist_notes_businessId_idx" ON "therapist_notes"("businessId");

-- CreateIndex
CREATE INDEX "therapist_notes_clientId_idx" ON "therapist_notes"("clientId");

-- CreateIndex
CREATE INDEX "therapist_notes_therapistId_idx" ON "therapist_notes"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_notes_isPinned_idx" ON "therapist_notes"("isPinned");

-- CreateIndex
CREATE INDEX "therapist_notes_createdAt_idx" ON "therapist_notes"("createdAt");

-- CreateIndex
CREATE INDEX "medical_conditions_businessId_idx" ON "medical_conditions"("businessId");

-- CreateIndex
CREATE INDEX "medical_conditions_clientId_idx" ON "medical_conditions"("clientId");

-- CreateIndex
CREATE INDEX "medical_conditions_status_idx" ON "medical_conditions"("status");

-- CreateIndex
CREATE INDEX "medical_conditions_createdAt_idx" ON "medical_conditions"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_businessId_idx" ON "audit_logs"("businessId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_preferredTherapistId_fkey" FOREIGN KEY ("preferredTherapistId") REFERENCES "therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_forms" ADD CONSTRAINT "intake_forms_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "intake_form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_notes" ADD CONSTRAINT "treatment_notes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_notes" ADD CONSTRAINT "treatment_notes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_notes" ADD CONSTRAINT "treatment_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_notes" ADD CONSTRAINT "treatment_notes_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_form_templates" ADD CONSTRAINT "intake_form_templates_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_maps" ADD CONSTRAINT "body_maps_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_maps" ADD CONSTRAINT "body_maps_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_maps" ADD CONSTRAINT "body_maps_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_maps" ADD CONSTRAINT "body_maps_treatmentNoteId_fkey" FOREIGN KEY ("treatmentNoteId") REFERENCES "treatment_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_notes" ADD CONSTRAINT "therapist_notes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_notes" ADD CONSTRAINT "therapist_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_notes" ADD CONSTRAINT "therapist_notes_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
