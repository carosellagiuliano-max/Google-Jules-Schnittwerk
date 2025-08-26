# Multi-Tenant SaaS Booking Platform

This is a full-stack booking application built with a multi-tenant architecture. It uses Next.js, Prisma, and Supabase to provide a robust, scalable, and secure platform for businesses (tenants) to manage their services, staff, and customer bookings.

Each tenant gets their own subdomain and can manage their own resources in isolation.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Deployment**: [Vercel](https://vercel.com/) (recommended)
- **Styling**: (Assumes Tailwind CSS from original project)

## Features

- **Multi-Tenancy**: Tenant isolation via domain and Row-Level Security (RLS).
- **Authentication**: Role-based authentication (customer, staff, owner, admin) via Supabase.
- **Customer Portal**: Book appointments, view personal bookings, cancel bookings (with 24h rule).
- **Admin Portal**: Full CRUD for services, staff, schedules, and time off. Manage all bookings and customers (ban/unban).
- **Dynamic Availability**: Real-time availability calculation based on staff schedules, bookings, and time off.

---

## 1. Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for running a local Postgres database)

### Step-by-Step Guide

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example `.env.example` file to a new `.env` file:
    ```bash
    cp .env.example .env
    ```
    You will need to fill in the values in this `.env` file in the next steps.

4.  **Run local PostgreSQL database:**
    A `docker-compose.yml` is not provided, but you can easily set one up or run Postgres directly. For a quick start, run:
    ```bash
    docker run --name booking-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
    ```
    Update your `.env` file with the default database URL:
    ```
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_app_dev"
    ```

5.  **Apply database migrations:**
    This will set up the database schema based on the `prisma/schema.prisma` file.
    ```bash
    npx prisma migrate dev
    ```

6.  **Seed the database:**
    This will create a demo tenant (`demo.deine-domain.ch`) and sample data.
    ```bash
    npx prisma db seed
    ```

7.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

8.  **Accessing the demo tenant locally:**
    To simulate accessing the demo tenant, you need to use a special header `x-tenant-host`. You can use a browser extension like "ModHeader" to set this header on your requests to `localhost:3000`.
    - **Header Name**: `x-tenant-host`
    - **Header Value**: `demo.deine-domain.ch`

---

## 2. Supabase Project Setup

This project uses Supabase for Authentication and its PostgreSQL database.

1.  **Create a Supabase Project:**
    - Go to [supabase.com](https://supabase.com) and create a new project.
    - Save your database password securely.

2.  **Get API Keys:**
    - In your Supabase project dashboard, go to `Project Settings` > `API`.
    - Find the **Project URL** and the **`anon` public key**.
    - Find the **`service_role` secret key**.
    - Add these to your `.env` file:
      ```
      NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
      NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
      SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
      ```

3.  **Configure Auth:**
    - Go to `Authentication` > `Providers` and ensure `Email` is enabled.
    - (Optional) Configure other providers as needed.
    - Go to `Authentication` > `URL Configuration` and set your site URL (e.g., `http://localhost:3000` for local dev, your production URL for deployment).

4.  **Connect to Supabase Database:**
    - In your Supabase project dashboard, go to `Project Settings` > `Database`.
    - Find the **Connection string** (URI) and update the `DATABASE_URL` in your `.env` file to point to your Supabase database.

---

## 3. Row-Level Security (RLS) Setup

The project is designed to use PostgreSQL's Row-Level Security to enforce tenant data isolation. The necessary SQL policies are included in the `prisma/migrations` directory.

When you run `npx prisma migrate dev` against your Supabase database, these policies will be applied automatically. They ensure that all queries are scoped to the tenant ID set in the session variable `app.tenant_id`, which the application middleware handles.

**To verify RLS is active:**
- Connect to your Supabase database.
- Run `select * from "Service";`. If you get 0 rows, RLS is likely working.
- Run `SET app.tenant_id = '...';` with a valid tenant ID, then `select * from "Service";`. You should now see rows for that tenant only.

---

## 4. Deployment to Vercel

[Vercel](https://vercel.com/) is the recommended hosting platform for this Next.js application.

1.  **Connect your Git repository** to a new Vercel project.
2.  **Configure Environment Variables:** In the Vercel project settings, add all the environment variables from your `.env` file (`DATABASE_URL`, Supabase keys, etc.).
3.  **Build & Deploy:** Vercel will automatically build and deploy your application on every push to the `main` branch.

### Configuring a Wildcard Domain

To support `tenant.yourdomain.com` subdomains:
1.  Add your custom domain (e.g., `yourdomain.com`) to your Vercel project.
2.  Instead of adding a specific subdomain, add `*` as the subdomain. This creates a wildcard domain.
3.  Follow the DNS instructions provided by Vercel to set up the necessary `A` or `CNAME` records with your domain registrar.

---

## 5. Onboarding a New Tenant

To add a new business (tenant) to the platform:

1.  **Connect to the database** directly or create an internal admin API endpoint for this.
2.  **Insert a new record** into the `Tenant` table:
    ```sql
    INSERT INTO "Tenant" (id, name, domain, plan)
    VALUES (cuid(), 'New Salon Name', 'new-salon.yourdomain.com', 'basic');
    ```
3.  **Create an owner profile** for the new tenant. This involves two steps:
    a. **Create a Supabase Auth user:** Use the Supabase client library to create a new user with an email and password.
    b. **Create a `Profile` record:** After getting the new user's ID from Supabase, insert a record into the `Profile` table, linking it to the new tenant and assigning the `owner` role.

---

## 6. API Reference

All API routes are protected and tenant-scoped.

### Customer APIs

- `GET /api/services`: Get all active services.
- `GET /api/staff`: Get all active staff.
- `GET /api/availability?serviceId=&staffId=&date=YYYY-MM-DD`: Get available slots.
- `POST /api/bookings`: Create a new booking.
- `GET /api/bookings/me`: Get my bookings.
- `DELETE /api/bookings/:id`: Cancel a booking (must be >24h in advance).

### Admin APIs (`/api/admin/...`)

Requires `owner` or `admin` role.

- **Services**: `GET, POST /services`, `GET, PUT, DELETE /services/:id`
- **Staff**: `GET, POST /staff`, `GET, PUT, DELETE /staff/:id`
- **Schedules**: `GET, POST /staff/:staffId/schedules`, `PUT, DELETE /staff/:staffId/schedules/:id`
- **Time Off**: `GET, POST /staff/:staffId/timeoff`, `PUT, DELETE /staff/:staffId/timeoff/:id`
- **Bookings**: `GET /bookings?params...`, `DELETE /bookings/:id`
- **Customers**: `GET /customers?search=...`, `POST /customers/ban`, `DELETE /customers/unban`
- **Settings**: `GET, PUT /tenant/settings`
