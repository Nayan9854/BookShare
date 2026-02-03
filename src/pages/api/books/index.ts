// src/pages/api/books/index.ts - FIXED WITH CONDITIONAL AUTH
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { decodeSessionToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // POST requires authentication
    const token = req.headers['x-session-token'] as string;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No session token provided' });
    }

    const decoded = decodeSessionToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
      }

      const { 
        title, 
        author, 
        isbn, 
        description, 
        publishYear, 
        pageCount, 
        language 
      } = req.body;

      if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
      }

      const book = await prisma.book.create({
        data: {
          title,
          author,
          isbn: isbn || null,
          description: description || null,
          publishYear: publishYear ? parseInt(publishYear) : null,
          pageCount: pageCount ? parseInt(pageCount) : null,
          language: language || 'English',
          ownerId: user.id,
          userId: user.id, // Initially, holder is owner
          status: 'AVAILABLE',
          isVisible: true,
          viewCount: 0,
          borrowCount: 0
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

      return res.status(201).json(book);
    } catch (error: any) {
      console.error('Create book error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // GET is public - no auth required
    try {
      // Get all visible, non-deleted, available books for the home page
      const books = await prisma.book.findMany({
        where: {
          status: 'AVAILABLE',
          isVisible: true,
          deletedAt: null
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          holder: {
            select: { id: true, name: true, email: true }
          },
          categories: {
            include: {
              category: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate average rating for each book
      const booksWithRating = books.map(book => {
        const avgRating = book.reviews.length > 0
          ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
          : 0;
        
        return {
          ...book,
          averageRating: Math.round(avgRating * 10) / 10
        };
      });

      res.json(booksWithRating);
    } catch (error: any) {
      console.error('Get books error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}