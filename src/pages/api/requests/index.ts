// src/pages/api/requests/index.ts - UPDATED TO ALWAYS LOAD DELIVERY
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get incoming requests (requests for books I own)
    const incoming = await prisma.borrowRequest.findMany({
      where: {
        book: {
          ownerId: req.userId
        }
      },
      include: {
        book: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            holder: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        borrower: {
          select: { id: true, name: true, email: true }
        },
        // ✅ ALWAYS include delivery information
        delivery: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            verificationCode: true,
            codeVerifiedAt: true,
            pickupAddress: true,
            deliveryAddress: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get outgoing requests (requests I made to borrow books)
    const outgoing = await prisma.borrowRequest.findMany({
      where: {
        borrowerId: req.userId
      },
      include: {
        book: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            holder: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        borrower: {
          select: { id: true, name: true, email: true }
        },
        // ✅ ALWAYS include delivery information
        delivery: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            verificationCode: true,
            codeVerifiedAt: true,
            pickupAddress: true,
            deliveryAddress: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ incoming, outgoing });
  } catch (error: any) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);