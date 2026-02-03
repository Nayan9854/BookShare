// src/pages/api/requests/[id]/respond.ts - UPDATED WITH POINTS SYSTEM
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { notifyRequestAccepted, notifyRequestRejected } from '../../../../lib/notifications';

const POINTS_PER_TRANSACTION = 20; // Points cost/reward

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { action } = req.body;

  if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be ACCEPT or REJECT' });
  }

  try {
    // Find the borrow request
    const request = await prisma.borrowRequest.findUnique({
      where: { id: Number(id) },
      include: {
        book: {
          include: {
            owner: { select: { id: true, name: true, points: true } }
          }
        },
        borrower: { select: { id: true, name: true, points: true } }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.book.ownerId !== req.userId) {
      return res.status(403).json({ 
        error: 'You can only respond to requests for your own books' 
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'This request has already been responded to' 
      });
    }

    // ACCEPT ACTION
    if (action === 'ACCEPT') {
      // ✅ CHECK: Does borrower have enough points?
      if (request.borrower.points < POINTS_PER_TRANSACTION) {
        return res.status(400).json({ 
          error: `Borrower doesn't have enough points. Required: ${POINTS_PER_TRANSACTION}, Available: ${request.borrower.points}. Ask them to purchase more points.` 
        });
      }

      // ✅ USE TRANSACTION FOR POINTS
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update borrow request
        const updatedRequest = await tx.borrowRequest.update({
          where: { id: Number(id) },
          data: { status: 'ACCEPTED' },
          include: {
            book: {
              include: {
                owner: { select: { id: true, name: true, email: true } },
                holder: { select: { id: true, name: true, email: true } }
              }
            },
            borrower: { select: { id: true, name: true, email: true } }
          }
        });

        // 2. Update book status
        await tx.book.update({
          where: { id: request.bookId },
          data: {
            status: 'BORROWED',
            userId: request.borrowerId,
            borrowCount: { increment: 1 }
          }
        });

        // 3. Update user statistics
        await tx.user.update({
          where: { id: request.borrowerId },
          data: { totalBorrows: { increment: 1 } }
        });

        await tx.user.update({
          where: { id: request.book.ownerId },
          data: { totalLends: { increment: 1 } }
        });

        // 4. 💰 DEDUCT POINTS FROM BORROWER
        const borrowerAfterDeduction = await tx.user.update({
          where: { id: request.borrowerId },
          data: {
            points: { decrement: POINTS_PER_TRANSACTION }
          }
        });

        // 5. 💰 CREATE DEDUCTION TRANSACTION
        await tx.pointTransaction.create({
          data: {
            userId: request.borrowerId,
            amount: -POINTS_PER_TRANSACTION,
            type: 'BORROW',
            description: `Borrowed "${request.book.title}" from ${request.book.owner.name}`,
            relatedId: request.id,
            balanceAfter: borrowerAfterDeduction.points
          }
        });

        // 6. 💰 ADD POINTS TO LENDER (OWNER)
        const ownerAfterAddition = await tx.user.update({
          where: { id: request.book.ownerId },
          data: {
            points: { increment: POINTS_PER_TRANSACTION }
          }
        });

        // 7. 💰 CREATE ADDITION TRANSACTION
        await tx.pointTransaction.create({
          data: {
            userId: request.book.ownerId,
            amount: POINTS_PER_TRANSACTION,
            type: 'LEND',
            description: `Lent "${request.book.title}" to ${request.borrower.name}`,
            relatedId: request.id,
            balanceAfter: ownerAfterAddition.points
          }
        });

        return {
          updatedRequest,
          borrowerNewBalance: borrowerAfterDeduction.points,
          ownerNewBalance: ownerAfterAddition.points
        };
      });

      // Send notifications
      await notifyRequestAccepted(
        request.borrowerId,
        request.book.title,
        request.id
      );

      // 💰 NOTIFY ABOUT POINTS
      await prisma.notification.create({
        data: {
          userId: request.borrowerId,
          type: 'SYSTEM_MESSAGE',
          title: '⭐ Points Deducted',
          message: `${POINTS_PER_TRANSACTION} points deducted for borrowing "${request.book.title}". New balance: ${result.borrowerNewBalance} points.`
        }
      });

      await prisma.notification.create({
        data: {
          userId: request.book.ownerId,
          type: 'SYSTEM_MESSAGE',
          title: '⭐ Points Earned',
          message: `You earned ${POINTS_PER_TRANSACTION} points for lending "${request.book.title}"! New balance: ${result.ownerNewBalance} points.`
        }
      });

      return res.status(200).json({
        message: `Request accepted! Borrower paid ${POINTS_PER_TRANSACTION} points, you earned ${POINTS_PER_TRANSACTION} points.`,
        request: result.updatedRequest,
        pointsTransferred: POINTS_PER_TRANSACTION
      });
    } 
    
    // REJECT ACTION
    else if (action === 'REJECT') {
      const updatedRequest = await prisma.borrowRequest.update({
        where: { id: Number(id) },
        data: { status: 'REJECTED' },
        include: {
          book: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
              holder: { select: { id: true, name: true, email: true } }
            }
          },
          borrower: { select: { id: true, name: true, email: true } }
        }
      });

      // Send notification
      await notifyRequestRejected(
        request.borrowerId,
        request.book.title,
        request.id
      );

      return res.status(200).json({
        message: 'Request rejected successfully',
        request: updatedRequest
      });
    }

  } catch (error: any) {
    console.error('Error responding to request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);