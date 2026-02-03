import { NextApiResponse } from 'next';
import { razorpayInstance } from '../../../lib/razorpay';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function createOrderHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { points, amount } = req.body;

  if (!points || !amount) {
    return res.status(400).json({ error: 'Points and amount required' });
  }

  try {
    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `points_${req.userId}_${Date.now()}`,
      notes: {
        userId: req.userId!.toString(),
        points: points.toString(),
        type: 'POINT_PURCHASE'
      }
    });

    // Create purchase record
    const purchase = await prisma.pointPurchase.create({
      data: {
        userId: req.userId!,
        points,
        amount,
        razorpayOrderId: order.id,
        status: 'PENDING'
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      purchaseId: purchase.id
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

export default withAuth(createOrderHandler);