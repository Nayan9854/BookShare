// src/pages/api/books/search.ts - FIXED (No Auth Required)
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    q, 
    category, 
    status, 
    sortBy = 'recent', 
    page = '1', 
    limit = '12' 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  try {
    // Build where clause
    const where: any = {
      isVisible: true,
      deletedAt: null
    };

    // Text search on title, author, or ISBN
    if (q && typeof q === 'string') {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { isbn: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Filter by status
    if (status === 'AVAILABLE' || status === 'BORROWED') {
      where.status = status;
    }

    // Filter by category
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      where.categories = {
        some: {
          category: {
            name: {
              in: categories
            }
          }
        }
      };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }; // default: recent
    
    if (sortBy === 'popular') {
      orderBy = { borrowCount: 'desc' };
    } else if (sortBy === 'rating') {
      // For rating, we'll need to calculate average later
      // For now, use viewCount as proxy
      orderBy = { viewCount: 'desc' };
    }

    // Get total count
    const total = await prisma.book.count({ where });

    // Get books
    const books = await prisma.book.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        holder: { select: { id: true, name: true, email: true } },
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
      orderBy,
      skip,
      take: limitNum
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

    // If sorting by rating, sort the results
    if (sortBy === 'rating') {
      booksWithRating.sort((a, b) => b.averageRating - a.averageRating);
    }

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: booksWithRating,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages
    });
  } catch (error: any) {
    console.error('Search books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}