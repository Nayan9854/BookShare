// src/pages/api/delivery/[id]/payment.ts - COMPLETE PAYMENT FLOW
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { paymentMethod } = req.body; // 'card', 'upi', 'wallet'

  if (!paymentMethod) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  try {
    // Find the delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        borrowRequest: {
          include: {
            borrower: { select: { id: true, name: true } },
            book: {
              select: { id: true, title: true }
            }
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Check if user is the borrower
    if (delivery.borrowRequest.borrowerId !== req.userId) {
      return res.status(403).json({ 
        error: 'Only the borrower can make payment for this delivery' 
      });
    }

    // Check if already paid
    if (delivery.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Payment already completed for this delivery',
        delivery
      });
    }

    // Check if delivery is in correct status
    if (delivery.status !== 'PENDING' && delivery.status !== 'ASSIGNED') {
      return res.status(400).json({ 
        error: 'Payment can only be made for pending or assigned deliveries' 
      });
    }

    // DUMMY PAYMENT PROCESSING
    // In production, integrate with Razorpay, Stripe, etc.
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate random payment failure (5% chance for testing)
    const shouldFail = Math.random() < 0.05; // 5% failure rate
    
    if (shouldFail) {
      // Update payment status to FAILED
      await prisma.delivery.update({
        where: { id: Number(id) },
        data: {
          paymentStatus: 'FAILED'
        }
      });
      
      return res.status(400).json({ 
        error: 'Payment processing failed. Please try again.',
        paymentStatus: 'FAILED'
      });
    }

    // Update delivery with payment info
    const updatedDelivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        paymentStatus: 'COMPLETED',
        paymentId
      },
      include: {
        borrowRequest: {
          include: {
            book: true,
            borrower: { select: { id: true, name: true } }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Payment successful! Your delivery will be processed.',
      delivery: updatedDelivery,
      payment: {
        id: paymentId,
        amount: delivery.paymentAmount,
        method: paymentMethod,
        status: 'COMPLETED',
        timestamp: new Date()
      },
      verificationCode: delivery.verificationCode, // Return code again for reference
      nextSteps: [
        'Wait for a delivery agent to accept your request',
        'Share the verification code with the agent when they arrive',
        'Track your delivery status in real-time'
      ]
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
}

export default withAuth(handler);