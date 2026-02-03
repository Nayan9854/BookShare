// src/pages/api/books/[id]/toggle-visibility.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Find the book
    const book = await prisma.book.findUnique({
      where: { id: Number(id) }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check ownership
    if (book.ownerId !== req.userId) {
      return res.status(403).json({ error: 'You can only modify your own books' });
    }

    // Cannot hide borrowed books
    if (book.status === 'BORROWED' && book.isVisible) {
      return res.status(400).json({ 
        error: 'Cannot hide books that are currently borrowed. Complete the transaction first.' 
      });
    }

    // Toggle visibility
    const updatedBook = await prisma.book.update({
      where: { id: Number(id) },
      data: {
        isVisible: !book.isVisible
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        holder: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(200).json({
      message: `Book ${updatedBook.isVisible ? 'shown' : 'hidden'} successfully`,
      book: updatedBook
    });
  } catch (error: any) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);