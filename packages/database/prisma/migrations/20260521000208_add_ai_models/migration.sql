-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'CLAUDE');

-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('NOTE_SUMMARY', 'TREATMENT_SUGGESTION', 'SOAP_ASSIST', 'SMART_REMINDER', 'ANALYTICS_INSIGHT');

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "requestDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompt_templates" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "feature" "AIFeature" NOT NULL,
    "template" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ANY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_businessId_idx" ON "ai_usage"("businessId");

-- CreateIndex
CREATE INDEX "ai_usage_userId_idx" ON "ai_usage"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_provider_idx" ON "ai_usage"("provider");

-- CreateIndex
CREATE INDEX "ai_usage_feature_idx" ON "ai_usage"("feature");

-- CreateIndex
CREATE INDEX "ai_usage_createdAt_idx" ON "ai_usage"("createdAt");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_businessId_idx" ON "ai_prompt_templates"("businessId");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_feature_idx" ON "ai_prompt_templates"("feature");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_isActive_idx" ON "ai_prompt_templates"("isActive");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_isDefault_idx" ON "ai_prompt_templates"("isDefault");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
