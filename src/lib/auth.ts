// src/lib/auth.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a simple session token (for demonstration)
 * In production, use proper JWT tokens
 */
export function generateSessionToken(userId: number): string {
  return Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
}

/**
 * Decode a session token
 */
export function decodeSessionToken(token: string): { userId: number; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}