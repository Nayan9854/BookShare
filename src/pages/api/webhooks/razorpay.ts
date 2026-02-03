// src/pages/api/webhooks/razorpay.ts - COMPLETE WEBHOOK HANDLER
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';

// Disable body parsing to access raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Read raw body from request stream
 */
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      resolve(rawBody);
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      console.error('Webhook signature missing');
      return res.status(400).json({ error: 'Webhook signature missing' });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature', {
        expected: expectedSignature,
        received: signature
      });
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Parse webhook event
    const event = JSON.parse(rawBody);
    console.log('Razorpay webhook received:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'order.paid':
        await handleOrderPaid(event);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.json({ 
      success: true,
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(event: any) {
  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const amount = payment.amount / 100; // Convert paise to rupees

  console.log('Payment captured:', {
    orderId,
    paymentId,
    amount
  });

  try {
    // Find delivery by Razorpay order ID
    const delivery = await prisma.delivery.findFirst({
      where: { paymentId: orderId }
    });

    if (!delivery) {
      console.error('Delivery not found for order:', orderId);
      return;
    }

    // Update delivery payment status
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        paymentStatus: 'COMPLETED',
        paymentId: paymentId
      }
    });

    console.log('Delivery payment updated:', delivery.id);

    // Optional: Create notification for user
    try {
      await prisma.notification.create({
        data: {
          userId: delivery.borrowRequest?.borrowerId || 0,
          type: 'SYSTEM_MESSAGE',
          title: 'Payment Confirmed',
          message: `Your payment of ₹${amount} has been confirmed. Your delivery will be processed soon.`,
          relatedId: delivery.id
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

  } catch (error) {
    console.error('Error processing payment capture:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: any) {
  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const errorDescription = payment.error_description || 'Payment failed';

  console.log('Payment failed:', {
    orderId,
    paymentId,
    error: errorDescription
  });

  try {
    // Find delivery by Razorpay order ID
    const delivery = await prisma.delivery.findFirst({
      where: { paymentId: orderId }
    });

    if (!delivery) {
      console.error('Delivery not found for failed payment:', orderId);
      return;
    }

    // Update delivery payment status to failed
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        paymentStatus: 'FAILED'
      }
    });

    console.log('Delivery payment marked as failed:', delivery.id);

    // Optional: Create notification for user
    try {
      await prisma.notification.create({
        data: {
          userId: delivery.borrowRequest?.borrowerId || 0,
          type: 'SYSTEM_MESSAGE',
          title: 'Payment Failed',
          message: `Your payment failed: ${errorDescription}. Please try again.`,
          relatedId: delivery.id
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

  } catch (error) {
    console.error('Error processing payment failure:', error);
    throw error;
  }
}

/**
 * Handle order paid event (alternative to payment.captured)
 */
async function handleOrderPaid(event: any) {
  const order = event.payload.order.entity;
  const orderId = order.id;
  const amount = order.amount_paid / 100;

  console.log('Order paid:', {
    orderId,
    amount
  });

  // This is similar to payment.captured
  // You can implement similar logic or just log it
}