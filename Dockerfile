# Stage 1: Install dependencies
FROM node:20-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# We don't need a real database for the build step,
# but Prisma and Next.js require the env vars to be present.
ENV DATABASE_URL="postgresql://user:password@host:port/db"
ENV NEXT_PUBLIC_SUPABASE_URL="http://localhost"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy-key"
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# The user running the app shouldn't be root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
