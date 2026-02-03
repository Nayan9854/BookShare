// src/pages/api/borrow/request.ts - UPDATED WITH POINTS CHECK
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { notifyBorrowRequest } from '../../../lib/notifications';

const POINTS_REQUIRED = 20;

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookId } = req.body;

  if (!bookId) {
    return res.status(400).json({ error: 'Book ID is required' });
  }

  try {
    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { points: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ CHECK: Does user have enough points?
    if (user.points < POINTS_REQUIRED) {
      return res.status(400).json({ 
        error: `Insufficient points! You need ${POINTS_REQUIRED} points to borrow a book. Your balance: ${user.points} points.`,
        requiredPoints: POINTS_REQUIRED,
        currentPoints: user.points,
        needToBuy: POINTS_REQUIRED - user.points
      });
    }

    // Check if book exists and is available
    const book = await prisma.book.findUnique({
      where: { id: Number(bookId) },
      include: {
        owner: { select: { id: true, name: true } }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Book is not available for borrowing' });
    }

    if (book.ownerId === req.userId) {
      return res.status(400).json({ error: 'You cannot borrow your own book' });
    }

    // Check if user already has a pending or accepted request for this book
    const existingRequest = await prisma.borrowRequest.findFirst({
      where: {
        bookId: Number(bookId),
        borrowerId: req.userId,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending or active request for this book' 
      });
    }

    // Increment view count
    await prisma.book.update({
      where: { id: Number(bookId) },
      data: {
        viewCount: { increment: 1 }
      }
    });

    // Create borrow request (points will be deducted when owner accepts)
    const borrowRequest = await prisma.borrowRequest.create({
      data: {
        bookId: Number(bookId),
        borrowerId: req.userId!,
        status: 'PENDING'
      },
      include: {
        book: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        borrower: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send notification to book owner
    await notifyBorrowRequest(
      book.ownerId,
      user.name,
      book.title,
      borrowRequest.id
    );

    // Send notification to borrower about points
    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: 'SYSTEM_MESSAGE',
        title: '📖 Borrow Request Sent',
        message: `Your request for "${book.title}" has been sent. If approved, ${POINTS_REQUIRED} points will be deducted from your account.`
      }
    });

    res.status(201).json({
      ...borrowRequest,
      pointsWillBeDeducted: POINTS_REQUIRED,
      currentBalance: user.points,
      balanceAfterApproval: user.points - POINTS_REQUIRED
    });

  } catch (error: any) {
    console.error('Create borrow request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);