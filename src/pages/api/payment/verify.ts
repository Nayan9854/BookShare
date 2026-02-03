// src/pages/api/payment/verify.ts - COMPLETE RAZORPAY VERIFICATION
import { NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    deliveryId
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !deliveryId) {
    return res.status(400).json({ 
      error: 'Missing required payment verification parameters' 
    });
  }

  try {
    // Step 1: Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      console.error('Invalid payment signature', {
        expected: expectedSignature,
        received: razorpay_signature
      });
      
      // Mark payment as failed
      await prisma.delivery.update({
        where: { id: Number(deliveryId) },
        data: { paymentStatus: 'FAILED' }
      });

      return res.status(400).json({ 
        error: 'Invalid payment signature. Payment verification failed.' 
      });
    }

    // Step 2: Find the delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(deliveryId) },
      include: {
        borrowRequest: {
          include: {
            book: {
              select: { id: true, title: true }
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

    // Step 3: Verify user is the borrower
    if (delivery.borrowRequest.borrowerId !== req.userId) {
      return res.status(403).json({ 
        error: 'Unauthorized. Only the borrower can verify payment.' 
      });
    }

    // Step 4: Check if already verified
    if (delivery.paymentStatus === 'COMPLETED') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        delivery,
        verificationCode: delivery.verificationCode,
        alreadyVerified: true
      });
    }

    // Step 5: Update delivery with payment confirmation
    const updatedDelivery = await prisma.delivery.update({
      where: { id: Number(deliveryId) },
      data: {
        paymentStatus: 'COMPLETED',
        paymentId: razorpay_payment_id
      },
      include: {
        borrowRequest: {
          include: {
            book: {
              select: { id: true, title: true, author: true }
            },
            borrower: { 
              select: { id: true, name: true, email: true } 
            }
          }
        }
      }
    });

    console.log('Payment verified successfully:', {
      deliveryId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      borrower: delivery.borrowRequest.borrower.email
    });

    // Step 6: Return success response with verification code
    res.json({
      success: true,
      message: 'Payment verified successfully',
      delivery: updatedDelivery,
      verificationCode: updatedDelivery.verificationCode,
      payment: {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'COMPLETED',
        amount: updatedDelivery.paymentAmount,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    
    // Try to mark payment as failed
    try {
      await prisma.delivery.update({
        where: { id: Number(deliveryId) },
        data: { paymentStatus: 'FAILED' }
      });
    } catch (updateError) {
      console.error('Failed to update payment status:', updateError);
    }

    res.status(500).json({ 
      error: 'Payment verification failed. Please contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withAuth(handler);