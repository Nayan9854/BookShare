// src/pages/api/delivery/create.ts - WITH VERIFICATION CODE
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';


async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { borrowRequestId, pickupAddress, deliveryAddress } = req.body;

  if (!borrowRequestId || !pickupAddress || !deliveryAddress) {
    return res.status(400).json({ 
      error: 'Borrow request ID, pickup address, and delivery address are required' 
    });
  }

  try {
    // Verify the borrow request exists and is accepted
    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id: Number(borrowRequestId) },
      include: {
        book: {
          include: {
            owner: { select: { id: true, name: true, email: true } }
          }
        },
        borrower: { select: { id: true, name: true, email: true } }
      }
    });

    if (!borrowRequest) {
      return res.status(404).json({ error: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'ACCEPTED') {
      return res.status(400).json({ 
        error: 'Can only create delivery for accepted borrow requests' 
      });
    }

    // IMPORTANT: Only the borrower can request delivery (not the owner)
    if (borrowRequest.borrowerId !== req.userId) {
      return res.status(403).json({ 
        error: 'Only the borrower can request delivery service' 
      });
    }

    // Check if delivery already exists
    const existingDelivery = await prisma.delivery.findUnique({
      where: { borrowRequestId: Number(borrowRequestId) }
    });

    if (existingDelivery) {
      return res.status(400).json({ 
        error: 'Delivery already exists for this borrow request' 
      });
    }

    // Create the delivery
    const delivery = await prisma.delivery.create({
      data: {
        borrowRequestId: Number(borrowRequestId),
        pickupAddress,
        deliveryAddress,
        status: 'PENDING'
      },
      include: {
        borrowRequest: {
          include: {
            book: {
              include: {
                owner: { select: { id: true, name: true, email: true } }
              }
            },
            borrower: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Delivery request created successfully',
      delivery
    });
  } catch (error: any) {
    console.error('Create delivery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);