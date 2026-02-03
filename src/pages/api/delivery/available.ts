// src/pages/api/delivery/available.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.user?.role !== 'DELIVERY_AGENT') {
    return res.status(403).json({ 
      error: 'Access denied. Delivery agent role required.' 
    });
  }

  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'PENDING',
        agentId: null
      },
      include: {
        borrowRequest: {
          include: {
            book: {
              include: {
                owner: { 
                  select: { id: true, name: true, email: true } 
                }
              }
            },
            borrower: { 
              select: { id: true, name: true, email: true } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);