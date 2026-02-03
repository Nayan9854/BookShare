// src/pages/api/delivery/track/[id].ts - UPDATED WITH VERIFICATION CODE ACCESS
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { decodeSessionToken } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        agent: { 
          select: { 
            id: true, 
            name: true, 
            email: true 
          } 
        },
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
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // ✅ CHECK IF USER IS AUTHENTICATED
    const token = req.headers['x-session-token'] as string;
    let userId: number | null = null;
    
    if (token) {
      const decoded = decodeSessionToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // ✅ DETERMINE IF USER CAN SEE VERIFICATION CODE
    // Only borrower, book owner, or delivery agent can see the code
    const isBorrower = userId === delivery.borrowRequest.borrowerId;
    const isOwner = userId === delivery.borrowRequest.book.ownerId;
    const isAgent = userId === delivery.agentId;
    const canSeeCode = isBorrower || isOwner || isAgent;

    // Prepare safe delivery data
    const safeDelivery = {
      id: delivery.id,
      status: delivery.status,
      pickupAddress: delivery.pickupAddress,
      deliveryAddress: delivery.deliveryAddress,
      paymentStatus: delivery.paymentStatus,
      paymentAmount: delivery.paymentAmount,
      codeVerifiedAt: delivery.codeVerifiedAt,
      // ✅ INCLUDE VERIFICATION CODE IF USER IS AUTHORIZED
      verificationCode: canSeeCode ? delivery.verificationCode : null,
      pickupScheduled: delivery.pickupScheduled,
      pickupCompleted: delivery.pickupCompleted,
      deliveryCompleted: delivery.deliveryCompleted,
      trackingNotes: delivery.trackingNotes,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
      agent: delivery.agent ? {
        name: delivery.agent.name
      } : null,
      borrowRequest: {
        book: {
          title: delivery.borrowRequest.book.title,
          author: delivery.borrowRequest.book.author,
          owner: {
            name: delivery.borrowRequest.book.owner.name
          }
        },
        borrower: {
          name: delivery.borrowRequest.borrower.name
        }
      }
    };

    res.json(safeDelivery);
  } catch (error: any) {
    console.error('Track delivery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}