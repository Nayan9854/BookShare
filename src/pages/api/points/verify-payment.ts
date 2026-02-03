import { NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function verifyPaymentHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    purchaseId
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseId) {
    return res.status(400).json({ error: 'Missing payment verification parameters' });
  }

  try {
    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      // Mark as failed
      await prisma.pointPurchase.update({
        where: { id: Number(purchaseId) },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get purchase details
    const purchase = await prisma.pointPurchase.findUnique({
      where: { id: Number(purchaseId) }
    });

    if (!purchase || purchase.userId !== req.userId) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status === 'COMPLETED') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        newBalance: (await prisma.user.findUnique({ where: { id: req.userId } }))?.points || 0
      });
    }

    // Update purchase as completed
    await prisma.pointPurchase.update({
      where: { id: Number(purchaseId) },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: razorpay_payment_id,
        completedAt: new Date()
      }
    });

    // Add points to user using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user points
      const user = await tx.user.update({
        where: { id: req.userId },
        data: {
          points: { increment: purchase.points }
        }
      });

      // Create transaction record
      await tx.pointTransaction.create({
        data: {
          userId: req.userId!,
          amount: purchase.points,
          type: 'PURCHASE',
          description: `Purchased ${purchase.points} points for ₹${purchase.amount}`,
          relatedId: purchase.id,
          balanceAfter: user.points
        }
      });

      return user;
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: 'SYSTEM_MESSAGE',
        title: '⭐ Points Added!',
        message: `${purchase.points} points have been added to your account. Current balance: ${result.points} points.`
      }
    });

    res.json({
      success: true,
      message: `Successfully added ${purchase.points} points!`,
      newBalance: result.points
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
}

export default withAuth(verifyPaymentHandler);