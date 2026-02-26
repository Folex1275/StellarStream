import { PrismaClient } from '../generated/client/client.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 constructor typing requires options; runtime accepts no args when using config
const PrismaCtor = PrismaClient as new (opts?: unknown) => PrismaClient;
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaCtor();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
