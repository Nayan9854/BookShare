// src/middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/prisma';
import { decodeSessionToken } from '../lib/auth';

export interface AuthenticatedRequest extends NextApiRequest {
  userId?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify user authentication
 * Checks for x-session-token header and validates it
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  const token = req.headers['x-session-token'] as string;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  const decoded = decodeSessionToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Helper function to wrap protected API routes
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    await authenticateUser(req, res, async () => {
      await handler(req, res);
    });
  };
}