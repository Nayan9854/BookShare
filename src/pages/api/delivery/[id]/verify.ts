import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function verifyHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { verificationCode } = req.body;

  if (!verificationCode) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        borrowRequest: {
          include: {
            book: true,
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
        error: 'Only the assigned agent can verify delivery' 
      });
    }

    // ✅ CHECK PAYMENT STATUS
    if (delivery.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Payment must be completed before verification'
      });
    }

    if (delivery.codeVerifiedAt) {
      return res.status(400).json({ 
        error: 'Code already verified',
        verifiedAt: delivery.codeVerifiedAt
      });
    }

    // ✅ VERIFY THE CODE
    if (delivery.verificationCode !== verificationCode.trim()) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please check with the borrower.' 
      });
    }

    // ✅ MARK AS VERIFIED
    const updatedDelivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        codeVerifiedAt: new Date()
      },
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

    // ✅ NOTIFY BORROWER
    await prisma.notification.create({
      data: {
        userId: delivery.borrowRequest.borrowerId,
        type: 'DELIVERY_PICKED_UP',
        title: '✓ Code Verified',
        message: `Your verification code was confirmed. ${req.user!.name} is picking up "${delivery.borrowRequest.book.title}".`,
        relatedId: delivery.id
      }
    });

    res.json({
      success: true,
      message: '✅ Code verified! You can now proceed with pickup.',
      delivery: updatedDelivery,
      nextStep: 'Update status to PICKED_UP after collecting the book'
    });
  } catch (error: any) {
    console.error('Verify delivery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(verifyHandler);