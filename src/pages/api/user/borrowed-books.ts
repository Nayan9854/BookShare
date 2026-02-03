// src/pages/api/user/borrowed-books.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get books where the user is the holder but not the owner
    const borrowedBooks = await prisma.book.findMany({
      where: {
        userId: req.userId,
        ownerId: {
          not: req.userId // Exclude books they own
        },
        deletedAt: null // Exclude soft-deleted books
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        holder: {
          select: { id: true, name: true, email: true }
        },
        borrowRequests: {
          where: {
            borrowerId: req.userId,
            status: 'ACCEPTED'
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(borrowedBooks);
  } catch (error: any) {
    console.error('Get borrowed books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);