-- CreateTable
CREATE TABLE "note_templates" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_templates_businessId_idx" ON "note_templates"("businessId");

-- CreateIndex
CREATE INDEX "note_templates_isGlobal_idx" ON "note_templates"("isGlobal");

-- CreateIndex
CREATE INDEX "note_templates_category_idx" ON "note_templates"("category");

-- AddForeignKey
ALTER TABLE "note_templates" ADD CONSTRAINT "note_templates_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_templates" ADD CONSTRAINT "note_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
