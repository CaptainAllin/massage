-- AddIndex: composite indexes for analytics query performance
CREATE INDEX "appointments_businessId_startTime_idx" ON "appointments"("businessId", "startTime");

-- AddIndex
CREATE INDEX "appointments_businessId_status_idx" ON "appointments"("businessId", "status");

-- AddIndex
CREATE INDEX "payments_businessId_paidAt_idx" ON "payments"("businessId", "paidAt");

-- AddIndex
CREATE INDEX "payments_businessId_status_idx" ON "payments"("businessId", "status");

-- AddIndex: clients.createdAt was missing a single-column index
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- AddIndex
CREATE INDEX "clients_businessId_createdAt_idx" ON "clients"("businessId", "createdAt");

-- AddIndex
CREATE INDEX "invoices_businessId_status_idx" ON "invoices"("businessId", "status");
