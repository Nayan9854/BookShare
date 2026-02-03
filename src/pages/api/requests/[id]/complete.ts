// src/pages/api/requests/[id]/complete.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Find the borrow request and include the book
    const request = await prisma.borrowRequest.findUnique({
      where: { id: Number(id) },
      include: {
        book: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Verify the logged-in user is the book owner
    if (request.book.ownerId !== req.userId) {
      return res.status(403).json({ 
        error: 'Only the book owner can mark a request as completed' 
      });
    }

    if (request.status !== 'ACCEPTED') {
      return res.status(400).json({ 
        error: 'Can only complete accepted requests' 
      });
    }

    // Use a transaction to update both request and book
    const [updatedRequest] = await prisma.$transaction([
      // Update the BorrowRequest to COMPLETED
      prisma.borrowRequest.update({
        where: { id: Number(id) },
        data: { status: 'COMPLETED' },
        include: {
          book: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
              holder: { select: { id: true, name: true, email: true } }
            }
          },
          borrower: { select: { id: true, name: true, email: true } }
        }
      }),
      // Reset the Book's status to AVAILABLE and holder back to owner
      prisma.book.update({
        where: { id: request.bookId },
        data: {
          status: 'AVAILABLE',
          userId: request.book.ownerId
        }
      })
    ]);

    return res.status(200).json({
      message: 'Book returned successfully',
      request: updatedRequest
    });
  } catch (error: any) {
    console.error('Error completing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);