// src/pages/api/analytics/admin.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if user is admin
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied. Admin role required.' 
    });
  }

  try {
    const [
      totalUsers,
      totalBooks,
      activeBorrows,
      totalDeliveries,
      popularBooks,
      categoryStats,
      recentUsers
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),

      // Total books count (non-deleted)
      prisma.book.count({
        where: { deletedAt: null }
      }),

      // Active borrows
      prisma.borrowRequest.count({
        where: { status: 'ACCEPTED' }
      }),

      // Total deliveries
      prisma.delivery.count(),

      // Top 5 most borrowed books
      prisma.book.findMany({
        where: { deletedAt: null },
        orderBy: { borrowCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          author: true,
          borrowCount: true,
          coverImage: true
        }
      }),

      // Category distribution
      prisma.category.findMany({
        include: {
          _count: {
            select: { books: true }
          }
        },
        orderBy: {
          books: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Recent users
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true
        }
      })
    ]);

    // Format category stats
    const categoryDistribution = categoryStats.map(cat => ({
      name: cat.name,
      count: cat._count.books
    }));

    res.json({
      totalUsers,
      totalBooks,
      activeBorrows,
      totalDeliveries,
      popularBooks,
      categoryDistribution,
      recentUsers
    });
  } catch (error: any) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);