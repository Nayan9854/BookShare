// src/pages/api/books/[id]/categories.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'POST') {
    // Add category to book
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    try {
      // Verify book exists and user owns it
      const book = await prisma.book.findUnique({
        where: { id: Number(id) }
      });

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      if (book.ownerId !== req.userId) {
        return res.status(403).json({ error: 'You can only modify your own books' });
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if already assigned
      const existing = await prisma.bookCategory.findUnique({
        where: {
          bookId_categoryId: {
            bookId: Number(id),
            categoryId: Number(categoryId)
          }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Category already assigned to this book' });
      }

      // Create book-category relation
      await prisma.bookCategory.create({
        data: {
          bookId: Number(id),
          categoryId: Number(categoryId)
        }
      });

      // Get updated book with categories
      const updatedBook = await prisma.book.findUnique({
        where: { id: Number(id) },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });

      res.json({
        message: 'Category added successfully',
        book: updatedBook
      });
    } catch (error: any) {
      console.error('Add category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // Remove category from book
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    try {
      // Verify book exists and user owns it
      const book = await prisma.book.findUnique({
        where: { id: Number(id) }
      });

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      if (book.ownerId !== req.userId) {
        return res.status(403).json({ error: 'You can only modify your own books' });
      }

      // Delete book-category relation
      await prisma.bookCategory.delete({
        where: {
          bookId_categoryId: {
            bookId: Number(id),
            categoryId: Number(categoryId)
          }
        }
      });

      res.json({ message: 'Category removed successfully' });
    } catch (error: any) {
      console.error('Remove category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);