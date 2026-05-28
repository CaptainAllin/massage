-- AddColumn: tags to clients
ALTER TABLE "clients" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
