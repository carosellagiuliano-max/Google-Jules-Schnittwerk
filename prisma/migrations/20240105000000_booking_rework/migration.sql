-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "StaffSchedule" DROP CONSTRAINT "StaffSchedule_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "StaffSchedule" DROP CONSTRAINT "StaffSchedule_staffId_fkey";

-- DropForeignKey
ALTER TABLE "StaffTimeOff" DROP CONSTRAINT "StaffTimeOff_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "StaffTimeOff" DROP CONSTRAINT "StaffTimeOff_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_staffId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerBan" DROP CONSTRAINT "CustomerBan_tenantId_fkey";

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "Staff";

-- DropTable
DROP TABLE "StaffSchedule";

-- DropTable
DROP TABLE "StaffTimeOff";

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "CustomerBan";

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_schedule" (
    "id" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,

    CONSTRAINT "staff_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_time_off" (
    "id" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "staffId" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "staff_time_off_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "serviceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "customerId" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,
    "cancelledByUserId" TEXT,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_ban" (
    "id" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_tenantId_role_idx" ON "profile"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "profile_tenantId_email_key" ON "profile"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "service_tenantId_name_key" ON "service"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_tenantId_name_key" ON "staff"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_schedule_tenantId_staffId_weekday_key" ON "staff_schedule"("tenantId", "staffId", "weekday");

-- CreateIndex
CREATE INDEX "booking_tenantId_staffId_start_at_idx" ON "booking"("tenantId", "staffId", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_ban_tenantId_email_key" ON "customer_ban"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedule" ADD CONSTRAINT "staff_schedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ban" ADD CONSTRAINT "customer_ban_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Custom SQL for booking constraints
-- Enable btree_gist extension for GIST indexes on standard data types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add an exclusion constraint to prevent overlapping bookings for the same staff member
ALTER TABLE "booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING GIST (
    "tenantId" WITH =,
    "staffId" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
  ) WHERE (status = 'CONFIRMED');
