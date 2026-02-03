import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function statusHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status, trackingNotes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = [
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      validStatuses 
    });
  }

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        borrowRequest: {
          include: {
            book: { select: { id: true, title: true } },
            borrower: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.agentId !== req.userId) {
      return res.status(403).json({ 
        error: 'Only the assigned agent can update delivery status' 
      });
    }

    // ✅ CHECK PAYMENT
    if (delivery.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Cannot update status until payment is completed' 
      });
    }

    // ✅ CHECK CODE VERIFICATION FOR PICKUP/TRANSIT/DELIVERED
    if (['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status) && !delivery.codeVerifiedAt) {
      return res.status(400).json({ 
        error: 'Verification code must be validated before proceeding with delivery',
        nextStep: 'Ask borrower for the 6-digit code and verify it first'
      });
    }

    // Prepare update data
    const updateData: any = {
      status,
      trackingNotes: trackingNotes || delivery.trackingNotes
    };

    // Set timestamps
    if (status === 'PICKED_UP' && !delivery.pickupCompleted) {
      updateData.pickupCompleted = new Date();
    } else if (status === 'DELIVERED' && !delivery.deliveryCompleted) {
      updateData.deliveryCompleted = new Date();
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        agent: { select: { id: true, name: true } },
        borrowRequest: {
          include: {
            book: true,
            borrower: { select: { id: true, name: true } }
          }
        }
      }
    });

    // ✅ SEND NOTIFICATIONS
    let notificationTitle = '';
    let notificationMessage = '';

    if (status === 'PICKED_UP') {
      notificationTitle = '📦 Book Picked Up';
      notificationMessage = `${req.user!.name} has picked up "${delivery.borrowRequest.book.title}" and it's on the way!`;
    } else if (status === 'IN_TRANSIT') {
      notificationTitle = '🚚 In Transit';
      notificationMessage = `Your book "${delivery.borrowRequest.book.title}" is on the way!`;
    } else if (status === 'DELIVERED') {
      notificationTitle = '✅ Book Delivered';
      notificationMessage = `"${delivery.borrowRequest.book.title}" has been delivered successfully!`;
    }

    if (notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: delivery.borrowRequest.borrowerId,
          type: 'DELIVERY_DELIVERED',
          title: notificationTitle,
          message: notificationMessage,
          relatedId: delivery.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      delivery: updatedDelivery
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(statusHandler);