-- This migration adds unique constraints to support idempotent seeding.

-- Add unique constraint for Service name per tenant
CREATE UNIQUE INDEX "Service_tenantId_name_key" ON "Service"("tenantId", "name");

-- Add unique constraint for Staff name per tenant
CREATE UNIQUE INDEX "Staff_tenantId_name_key" ON "Staff"("tenantId", "name");

-- Add unique constraint for StaffSchedule weekday per staff member
CREATE UNIQUE INDEX "StaffSchedule_tenantId_staffId_weekday_key" ON "StaffSchedule"("tenantId", "staffId", "weekday");
