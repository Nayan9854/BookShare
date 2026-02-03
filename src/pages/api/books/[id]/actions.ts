// src/pages/api/books/[id]/actions.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const bookId = Number(id);

  if (req.method === 'PATCH') {
    // Toggle visibility or soft delete
    const { action } = req.body;

    if (!action || !['hide', 'show', 'delete'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be hide, show, or delete' 
      });
    }

    try {
      // Verify ownership
      const book = await prisma.book.findUnique({
        where: { id: bookId }
      });

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      if (book.ownerId !== req.userId) {
        return res.status(403).json({ 
          error: 'You can only modify your own books' 
        });
      }

      // Check if book is currently borrowed
      if (action === 'delete' && book.status === 'BORROWED') {
        return res.status(400).json({ 
          error: 'Cannot delete a book that is currently borrowed' 
        });
      }

      // Perform action
      let updatedBook;
      switch (action) {
        case 'hide':
          updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: { isVisible: false }
          });
          break;
        case 'show':
          updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: { isVisible: true }
          });
          break;
        case 'delete':
          updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: { deletedAt: new Date() }
          });
          break;
      }

      res.json({ 
        message: `Book ${action}d successfully`,
        book: updatedBook 
      });
    } catch (error: any) {
      console.error('Book action error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);