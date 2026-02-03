// src/pages/api/user/profile.ts - UPDATE USER PROFILE
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
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
          points: true,
          role: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
  
  else if (req.method === 'PATCH') {
    const { name, bio, location } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          name: name.trim(),
          bio: bio?.trim() || null,
          location: location?.trim() || null
        },
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
          points: true,
          role: true,
          createdAt: true
        }
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } 
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(handler);