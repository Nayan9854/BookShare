// src/pages/api/analytics/user.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.userId;

    // Get user's owned books count
    const ownedBooksCount = await prisma.book.count({
      where: {
        ownerId: userId,
        deletedAt: null
      }
    });

    // Get user's borrowed books count
    const borrowedBooksCount = await prisma.book.count({
      where: {
        userId: userId,
        ownerId: { not: userId },
        status: 'BORROWED',
        deletedAt: null
      }
    });

    // Get incoming requests (pending)
    const incomingRequestsCount = await prisma.borrowRequest.count({
      where: {
        book: {
          ownerId: userId
        },
        status: 'PENDING'
      }
    });

    // Get outgoing requests (pending)
    const outgoingRequestsCount = await prisma.borrowRequest.count({
      where: {
        borrowerId: userId,
        status: 'PENDING'
      }
    });

    // Get total accepted requests (books currently lent out)
    const lentOutCount = await prisma.book.count({
      where: {
        ownerId: userId,
        status: 'BORROWED',
        deletedAt: null
      }
    });

    // Get completed transactions
    const completedTransactionsCount = await prisma.borrowRequest.count({
      where: {
        OR: [
          { book: { ownerId: userId } },
          { borrowerId: userId }
        ],
        status: 'COMPLETED'
      }
    });

    // Get recently added books
    const recentBooks = await prisma.book.findMany({
      where: {
        ownerId: userId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        author: true,
        status: true,
        createdAt: true
      }
    });

    // Get recent requests
    const recentRequests = await prisma.borrowRequest.findMany({
      where: {
        OR: [
          { book: { ownerId: userId } },
          { borrowerId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true
          }
        },
        borrower: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      stats: {
        ownedBooks: ownedBooksCount,
        borrowedBooks: borrowedBooksCount,
        incomingRequests: incomingRequestsCount,
        outgoingRequests: outgoingRequestsCount,
        lentOut: lentOutCount,
        completedTransactions: completedTransactionsCount
      },
      recentBooks,
      recentRequests
    });
  } catch (error: any) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);