// src/pages/api/points/index.ts - GET USER POINTS
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { points: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transaction history
    const transactions = await prisma.pointTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Calculate statistics
    const stats = transactions.reduce(
      (acc, txn) => {
        if (txn.amount > 0) {
          acc.totalEarned += txn.amount;
        } else {
          acc.totalSpent += Math.abs(txn.amount);
        }
        
        if (txn.type === 'PURCHASE') {
          acc.totalPurchased += txn.amount;
        } else if (txn.type === 'BORROW') {
          acc.borrowCount++;
        } else if (txn.type === 'LEND') {
          acc.lendCount++;
        }
        
        return acc;
      },
      {
        totalEarned: 0,
        totalSpent: 0,
        totalPurchased: 0,
        borrowCount: 0,
        lendCount: 0
      }
    );

    res.json({
      currentPoints: user.points,
      transactions,
      statistics: stats
    });

  } catch (error: any) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);