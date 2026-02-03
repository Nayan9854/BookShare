// src/pages/api/payment/create-order.ts
import { NextApiResponse } from 'next';
import { razorpayInstance } from '../../../lib/razorpay';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { deliveryId, amount } = req.body;

  if (!deliveryId || !amount) {
    return res.status(400).json({ error: 'Delivery ID and amount required' });
  }

  try {
    // Verify delivery exists and user is borrower
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(deliveryId) },
      include: {
        borrowRequest: {
          include: {
            borrower: { select: { id: true, name: true, email: true } },
            book: { select: { id: true, title: true } }
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.borrowRequest.borrowerId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `delivery_${deliveryId}_${Date.now()}`,
      notes: {
        deliveryId: deliveryId.toString(),
        userId: req.userId!.toString(),
        bookTitle: delivery.borrowRequest.book.title,
      }
    });

    // Store order ID in delivery
    await prisma.delivery.update({
      where: { id: Number(deliveryId) },
      data: {
        paymentId: order.id, // Store Razorpay order ID
        paymentStatus: 'PENDING'
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      deliveryId,
      verificationCode: delivery.verificationCode
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
}

export default withAuth(handler);