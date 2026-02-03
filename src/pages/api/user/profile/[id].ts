// src/pages/api/user/profile/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          avatar: true,
          location: true,
          rating: true,
          totalBorrows: true,
          totalLends: true,
          createdAt: true,
          ownedBooks: {
            where: {
              isVisible: true,
              deletedAt: null
            },
            select: {
              id: true,
              title: true,
              author: true,
              status: true,
              coverImage: true
            },
            take: 6
          },
          receivedRatings: {
            include: {
              rater: {
                select: { id: true, name: true, avatar: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate average rating
      const avgRating = user.receivedRatings.length > 0
        ? user.receivedRatings.reduce((sum, r) => sum + r.rating, 0) / user.receivedRatings.length
        : 5.0;

      res.json({
        ...user,
        averageRating: Math.round(avgRating * 10) / 10
      });
    } catch (error: any) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}