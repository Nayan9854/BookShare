// src/pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
export const config = { runtime: "nodejs" }; // ensure Node runtime

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error("DB health check failed:", e);
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
}
