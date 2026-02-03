// src/pages/api/delivery/return/request.ts - CREATE RETURN DELIVERY
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
        borrower: { select: { id: true, name: true, email: true } },
        delivery: {
          include: {
            agent: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!borrowRequest) {
      return res.status(404).json({ error: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'ACCEPTED') {
      return res.status(400).json({ 
        error: 'Can only create return delivery for accepted borrow requests' 
      });
    }

    // ✅ IMPORTANT: Only the BORROWER can request return delivery
    if (borrowRequest.borrowerId !== req.userId) {
      return res.status(403).json({ 
        error: 'Only the borrower can request return delivery service' 
      });
    }

    // Check if original delivery exists
    if (!borrowRequest.delivery) {
      return res.status(400).json({ 
        error: 'Original delivery not found. Cannot create return delivery.' 
      });
    }

    // Check if return delivery already exists
    const existingReturnDelivery = await prisma.delivery.findFirst({
      where: {
        borrowRequestId: Number(borrowRequestId),
        pickupAddress: pickupAddress, // Return pickup = borrower's address
        deliveryAddress: deliveryAddress // Return delivery = owner's address
      }
    });

    if (existingReturnDelivery) {
      return res.status(400).json({ 
        error: 'Return delivery already exists for this borrow request',
        deliveryId: existingReturnDelivery.id
      });
    }

    // Get the original agent
    const originalAgent = borrowRequest.delivery.agent;
    const originalAgentId = borrowRequest.delivery.agentId;

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // ✅ CREATE RETURN DELIVERY - AUTOMATICALLY ASSIGNED TO SAME AGENT
    const returnDelivery = await prisma.delivery.create({
      data: {
        borrowRequestId: Number(borrowRequestId),
        pickupAddress, // Borrower's address (pickup from borrower)
        deliveryAddress, // Owner's address (deliver to owner)
        status: originalAgentId ? 'ASSIGNED' : 'PENDING', // Auto-assign if agent exists
        agentId: originalAgentId, // Assign to same agent
        verificationCode,
        paymentStatus: 'COMPLETED', // ✅ NO PAYMENT REQUIRED FOR RETURNS
        paymentAmount: 0 // Free return delivery
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
        },
        agent: { select: { id: true, name: true, email: true } }
      }
    });

    // ✅ NOTIFY THE ORIGINAL AGENT
    if (originalAgentId && originalAgent) {
      await prisma.notification.create({
        data: {
          userId: originalAgentId,
          type: 'DELIVERY_ASSIGNED',
          title: '📦 Return Delivery Assigned',
          message: `You have been assigned a return delivery for "${borrowRequest.book.title}". No payment required - free return service!`,
          relatedId: returnDelivery.id
        }
      });
    }

    // ✅ NOTIFY THE BORROWER
    await prisma.notification.create({
      data: {
        userId: borrowRequest.borrowerId,
        type: 'SYSTEM_MESSAGE',
        title: '🔄 Return Delivery Created',
        message: `Your return delivery request has been created${originalAgent ? ` and assigned to ${originalAgent.name}` : ''}. Verification code: ${verificationCode}`,
        relatedId: returnDelivery.id
      }
    });

    // ✅ NOTIFY THE BOOK OWNER
    await prisma.notification.create({
      data: {
        userId: borrowRequest.book.ownerId,
        type: 'SYSTEM_MESSAGE',
        title: '📚 Book Return in Progress',
        message: `${borrowRequest.borrower.name} has requested return delivery for "${borrowRequest.book.title}". The book will be returned to you soon.`,
        relatedId: returnDelivery.id
      }
    });

    res.status(201).json({
      success: true,
      message: originalAgent 
        ? `Return delivery assigned to ${originalAgent.name}. No payment required!`
        : 'Return delivery created. Waiting for agent assignment.',
      delivery: returnDelivery,
      verificationCode,
      isReturn: true,
      freeDelivery: true,
      agentInfo: originalAgent ? {
        name: originalAgent.name,
        message: 'Same agent from your original delivery will handle the return.'
      } : null
    });

  } catch (error: any) {
    console.error('Create return delivery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);