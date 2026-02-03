// src/pages/api/books/[id]/delete.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { permanent } = req.query; // ?permanent=true for hard delete

  try {
    // Find the book with pending/accepted requests
    const book = await prisma.book.findUnique({
      where: { id: Number(id) },
      include: {
        borrowRequests: {
          where: {
            status: {
              in: ['PENDING', 'ACCEPTED']
            }
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check ownership
    if (book.ownerId !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own books' });
    }

    // Cannot delete borrowed books
    if (book.status === 'BORROWED') {
      return res.status(400).json({ 
        error: 'Cannot delete books that are currently borrowed. Wait for the book to be returned.' 
      });
    }

    // Cannot delete books with active requests
    if (book.borrowRequests.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete books with pending or accepted borrow requests. Reject or complete them first.' 
      });
    }

    if (permanent === 'true') {
      // Hard delete (permanent)
      await prisma.book.delete({
        where: { id: Number(id) }
      });

      return res.status(200).json({
        message: 'Book permanently deleted',
        deleted: true
      });
    } else {
      // Soft delete (mark as deleted)
      const updatedBook = await prisma.book.update({
        where: { id: Number(id) },
        data: {
          deletedAt: new Date(),
          isVisible: false // Also hide it
        }
      });

      return res.status(200).json({
        message: 'Book deleted successfully',
        book: updatedBook
      });
    }
  } catch (error: any) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);