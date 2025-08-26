# Multi-Tenant SaaS Booking Platform

This is a full-stack booking application built with a multi-tenant architecture. It uses Next.js, Prisma, and Supabase to provide a robust, scalable, and secure platform for businesses (tenants) to manage their services, staff, and customer bookings.

Each tenant gets their own subdomain and can manage their own resources in isolation.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Deployment**: [Vercel](https://vercel.com/) (recommended)

---

## 1. Local Development Setup (Runbook)

### 1.1. Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (for running a local Postgres database)

### 1.2. Environment Variables

Copy the example `.env.example` file to a new `.env` file (`cp .env.example .env`) and fill in the following values:

| Variable                      | Description                                                                 | Example Value                                                 |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`                | Connection string for your PostgreSQL database.                             | `postgresql://postgres:postgres@localhost:5432/booking_app_dev` |
| `NEXT_PUBLIC_SUPABASE_URL`    | The public URL for your Supabase project.                                   | `https://your-project-ref.supabase.co`                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous, public API key for your Supabase project.                    | `ey...`                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`   | The secret service role key for privileged backend operations.              | `ey...`                                                       |
| `NEXT_PUBLIC_APP_URL`         | The public URL of your application (used for auth redirects, etc.).         | `http://localhost:3000`                                       |
| `SUPABASE_JWT_SECRET`         | Your project's JWT secret for verifying tokens. Found in Supabase settings. | `your-super-secret-jwt-secret`                                |


### 1.3. Step-by-Step Guide

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url> && cd <repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file and fill it in as described above.

4.  **Run local PostgreSQL database:**
    If you don't have a running Postgres instance, you can start one with Docker:
    ```bash
    docker run --name booking-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
    ```

5.  **Apply database migrations:**
    This sets up the database schema and applies RLS policies.
    ```bash
    npx prisma migrate dev
    ```

6.  **Seed the database:**
    This creates the demo tenant and test users. The script is idempotent and safe to run multiple times.
    ```bash
    npx prisma db seed
    ```

7.  **Run the development server:**
    ```bash
    npm run dev
    ```

8.  **Accessing the demo tenant locally:**
    To simulate accessing `demo.deine-domain.ch`, use a browser extension (e.g., ModHeader) to set the `x-tenant-host` header on your requests to `http://localhost:3000`.

---

## 2. Security: RLS & Tenant Safety

Data isolation is enforced at the database level using PostgreSQL's Row-Level Security (RLS).

### 2.1. RLS Policies

For every table with a `tenantId`, the following policy is applied, which forces all queries to be scoped to the tenant set in the current session. The full SQL can be found in the migration file under `prisma/migrations/20240103000000_add_rls_policies/migration.sql`.

```sql
-- Example for the "Service" table
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" FORCE ROW LEVEL SECURITY; -- Applies policy to table owner too

CREATE POLICY tenant_isolation_policy ON "Service"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));
```

### 2.2. RLS Test Snippet

You can verify RLS is working by connecting to your database and running:

```sql
-- 1. This query should fail or return 0 rows because app.tenant_id is not set.
SELECT * FROM "Service";

-- 2. Set the tenant context for the current session.
-- Replace 'your_tenant_id' with the actual ID of the demo tenant from your DB.
SET app.tenant_id = 'your_tenant_id';

-- 3. This query should now succeed and return only the services for that tenant.
SELECT * FROM "Service";
```

---

## 3. Authentication & Roles

### 3.1. User Profile Creation

User authentication is handled by Supabase Auth. To link a Supabase user to a tenant-specific profile in our database, you must set up a trigger and edge function in Supabase.

1.  **Create a Supabase Edge Function** (`/supabase/functions/create-profile-on-signup/index.ts`) that receives the new user object.
2.  Inside the function, extract the tenant domain from the user's email or metadata.
3.  Look up the `tenantId` from the `Tenant` table.
4.  Insert a new record into the public `Profile` table with the user's ID, email, tenantId, and a default role (e.g., `customer`).

### 3.2. Test Credentials

The seed script creates the following profiles for the `demo.deine-domain.ch` tenant. **Note:** You must create these users in your Supabase project manually with the same emails and a password of your choice (e.g., `password123`) for the login to work.

-   **Owner/Admin:**
    -   **Email:** `owner@demo.deine-domain.ch`
    -   **Password:** (you set this in Supabase)
-   **Customer:**
    -   **Email:** `customer@demo.deine-domain.ch`
    -   **Password:** (you set this in Supabase)

### 3.3. Changing User Roles

Changing a user's role should be a privileged, admin-only action. An API endpoint like `PUT /api/admin/customers/:id` could be created to update the `role` field on a `Profile`.

---

## 4. Business Logic

### 4.1. Availability & Booking

-   **Timezone Handling**: All dates and times on the backend are handled in **UTC**. The frontend is responsible for converting these to the user's local timezone (e.g., Europe/Zurich) and sending ISO 8601 strings back to the API.
-   **Slot Granularity**: The `/api/availability` endpoint generates potential slots by checking every **15 minutes**.
-   **Collision Prevention**: Booking creation (`POST /api/bookings`) is wrapped in a Prisma `$transaction`. Inside the transaction, it performs a final check for any overlapping bookings for the selected staff member to prevent race conditions and double bookings.

### 4.2. 24-Hour Cancellation Rule

-   **Enforcement**: This rule is enforced in the `DELETE /api/bookings/:id` endpoint.
-   **Logic**: It checks if the current time is at least 24 hours before the booking's start time.
-   **Error**: If the rule is violated, it returns a `400 Bad Request` with the error message "Cancellation period has passed."
-   **Admin Override**: Admins can bypass this rule by using the `DELETE /api/admin/bookings/:id` endpoint, which cancels the booking immediately regardless of the start time.

---

## 5. API Reference

Common error codes:
- `400 Bad Request`: Invalid request body or parameters.
- `401 Unauthorized`: Authentication required but not provided.
- `403 Forbidden`: Authenticated but not authorized for the action.
- `404 Not Found`: Resource not found.
- `409 Conflict`: The request could not be completed due to a conflict (e.g., double booking, already banned).
- `500 Internal Server Error`: A generic server error occurred.

### Customer APIs

-   **`GET /api/services`**: Get active services.
    -   **Response `200 OK`**: `[{ "id": "...", "name": "Haircut", ... }]`
-   **`GET /api/staff`**: Get active staff.
    -   **Response `200 OK`**: `[{ "id": "...", "name": "Jane Doe", ... }]`
-   **`GET /api/availability?serviceId=...&staffId=...&date=...`**: Get available slots.
    -   **Response `200 OK`**: `["09:00", "09:30", "14:00"]`
-   **`POST /api/bookings`**: Create a booking.
    -   **Request Body**: `{ "serviceId": "...", "staffId": "...", "start": "2024-12-25T09:30:00.000Z" }`
    -   **Response `201 Created`**: The full booking object.
-   **`GET /api/bookings/me`**: Get my bookings.
    -   **Response `200 OK`**: `[ { "id": "...", "status": "CONFIRMED", "service": {...}, "staff": {...} } ]`
-   **`DELETE /api/bookings/:id`**: Cancel a booking.
    -   **Response `200 OK`**: The updated (cancelled) booking object.

### Admin APIs (`/api/admin/...`)

-   **`GET /services`**: Get all services.
-   **`POST /services`**: Create a service.
    -   **Request Body**: `{ "name": "Manicure", "duration": 45, "price": 80 }`
-   **`PUT /services/:id`**: Update a service.
-   **`DELETE /services/:id`**: Delete a service.
-   ... (and so on for Staff, Schedules, Time Off, Bookings, Customers, Settings).

---

## 6. Deployment & CI/CD

-   **CI/CD**: The GitHub Actions workflow in `.github/workflows/ci.yml` runs `lint` and `build` on every push to `main`.
-   **Deployment**: Vercel is recommended. Connect your repository and add the environment variables listed in section 1.2.
-   **Domain Onboarding**: To add a new tenant domain, first add a wildcard domain `*.your-domain.tld` to your Vercel project. Then, when creating a tenant in the database, set the `domain` field to the desired subdomain (e.g., `new-salon.your-domain.tld`).

---

## 7. Housekeeping

All leftover code and configuration from the original "Lovable" Vite template have been removed. The project structure is now a standard Next.js application.
