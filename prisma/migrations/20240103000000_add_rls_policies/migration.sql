-- This migration enables Row-Level Security (RLS) for all tables
-- and creates policies to enforce tenant isolation.

-- Helper function to get the tenant_id from the session.
-- This function is not strictly necessary if we always use current_setting,
-- but it can be useful for debugging or more complex policies.
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.tenant_id', true);
$$ LANGUAGE sql STABLE;


-- =============================================
-- Tenant Table
-- =============================================
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "Tenant";
CREATE POLICY tenant_isolation_policy ON "Tenant"
  FOR ALL
  USING (id = auth.tenant_id())
  WITH CHECK (id = auth.tenant_id());


-- =============================================
-- Profile Table
-- =============================================
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "Profile";
CREATE POLICY tenant_isolation_policy ON "Profile"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());


-- =============================================
-- Service Table
-- =============================================
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "Service";
CREATE POLICY tenant_isolation_policy ON "Service"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());


-- =============================================
-- Staff Table
-- =============================================
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "Staff";
CREATE POLICY tenant_isolation_policy ON "Staff"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());


-- =============================================
-- StaffSchedule Table
-- =============================================
ALTER TABLE "StaffSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffSchedule" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "StaffSchedule";
CREATE POLICY tenant_isolation_policy ON "StaffSchedule"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());


-- =============================================
-- StaffTimeOff Table
-- =============================================
ALTER TABLE "StaffTimeOff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffTimeOff" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "StaffTimeOff";
CREATE POLICY tenant_isolation_policy ON "StaffTimeOff"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());


-- =============================================
-- Booking Table
-- =============================================
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "Booking";
CREATE POLICY tenant_isolation_policy ON "Booking"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());


-- =============================================
-- CustomerBan Table
-- =============================================
ALTER TABLE "CustomerBan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerBan" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "CustomerBan";
CREATE POLICY tenant_isolation_policy ON "CustomerBan"
  FOR ALL
  USING ("tenantId" = auth.tenant_id())
  WITH CHECK ("tenantId" = auth.tenant_id());
