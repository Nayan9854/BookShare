import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// ✅ Load variables from .env.local manually
dotenv.config({ path: ".env.local" });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        // ✅ Explicitly pass DATABASE_URL to Prisma client
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
