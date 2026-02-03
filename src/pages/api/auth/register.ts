// src/pages/api/auth/register.ts - UPDATED WITH INITIAL POINTS
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

const INITIAL_POINTS = 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with initial points using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with 100 initial points
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
          points: INITIAL_POINTS
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          points: true,
          createdAt: true
        }
      });

      // Create initial points transaction record
      await tx.pointTransaction.create({
        data: {
          userId: user.id,
          amount: INITIAL_POINTS,
          type: 'INITIAL',
          description: 'Welcome bonus - Free points for new users!',
          balanceAfter: INITIAL_POINTS
        }
      });

      return user;
    });

    res.status(201).json(result);

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}