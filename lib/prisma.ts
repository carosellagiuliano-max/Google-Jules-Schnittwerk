import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma client instance.
// This is to ensure that in development, where the module cache is cleared on every request,
// we don't end up with a new Prisma Client instance on every hot reload.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Instantiate the Prisma client.
// In production, we'll create a new instance.
// In development, we'll check if an instance already exists on the global object.
// If it does, we'll use that. Otherwise, we'll create a new one.
export const prisma = global.prisma || new PrismaClient();

// If we're in development, assign the prisma client to the global object.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
