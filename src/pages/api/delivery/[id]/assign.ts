import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

async function assignHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (req.user?.role !== 'DELIVERY_AGENT' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied. Delivery agent role required.' 
    });
  }

  try {
    // ✅ FIRST CHECK IF ALREADY ASSIGNED (RACE CONDITION PROTECTION)
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        borrowRequest: {
          include: {
            borrower: { select: { id: true, name: true } },
            book: {
              include: {
                owner: { select: { id: true, name: true } }
              }
            }
          }
        },
        agent: { select: { id: true, name: true } }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'This delivery has already been assigned or completed',
        assignedTo: delivery.agent?.name || 'Another agent'
      });
    }

    if (delivery.agentId !== null) {
      return res.status(400).json({ 
        error: `Sorry! This delivery was just assigned to ${delivery.agent?.name}. Try another one.`,
        assignedTo: delivery.agent?.name
      });
    }

    // ✅ ASSIGN TO THIS AGENT (ATOMIC OPERATION)
    const updatedDelivery = await prisma.delivery.update({
      where: { 
        id: Number(id),
        agentId: null // Double-check it's still unassigned
      },
      data: {
        agentId: req.userId,
        status: 'ASSIGNED'
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
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

    // ✅ NOTIFY BORROWER ABOUT AGENT ASSIGNMENT
    await prisma.notification.create({
      data: {
        userId: delivery.borrowRequest.borrowerId,
        type: 'DELIVERY_ASSIGNED',
        title: '🚚 Delivery Agent Assigned',
        message: `${req.user!.name} will deliver "${delivery.borrowRequest.book.title}". Please complete payment to proceed.`,
        relatedId: updatedDelivery.id
      }
    });

    // ✅ DELETE NOTIFICATIONS FOR OTHER AGENTS
    await prisma.notification.deleteMany({
      where: {
        relatedId: Number(id),
        type: 'DELIVERY_ASSIGNED',
        userId: { not: req.userId }
      }
    });

    res.json({
      success: true,
      message: 'Delivery assigned successfully! Wait for payment confirmation.',
      delivery: updatedDelivery
    });
  } catch (error: any) {
    console.error('Assign delivery error:', error);
    
    // Handle race condition - delivery was assigned to someone else
    if (error.code === 'P2025') {
      return res.status(409).json({ 
        error: 'This delivery was just assigned to another agent. Please try another delivery.' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(assignHandler);