// src/pages/api/agent/earnings.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.user?.role !== 'DELIVERY_AGENT' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Access denied. Delivery agent role required.' 
    });
  }

  try {
    // Get all deliveries for this agent
    const deliveries = await prisma.delivery.findMany({
      where: {
        agentId: req.userId,
        status: {
          in: ['COMPLETED', 'DELIVERED']
        }
      },
      include: {
        borrowRequest: {
          include: {
            book: {
              select: {
                title: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: {
        deliveryCompleted: 'desc'
      }
    });

    // Calculate earnings
    const EARNING_PER_DELIVERY = 50;
    const totalEarnings = deliveries.length * EARNING_PER_DELIVERY;
    
    // Calculate time-based earnings
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayDeliveries = deliveries.filter(d => 
      new Date(d.deliveryCompleted || d.updatedAt) >= todayStart
    );
    
    const weekDeliveries = deliveries.filter(d => 
      new Date(d.deliveryCompleted || d.updatedAt) >= weekStart
    );
    
    const monthDeliveries = deliveries.filter(d => 
      new Date(d.deliveryCompleted || d.updatedAt) >= monthStart
    );

    const todayEarnings = todayDeliveries.length * EARNING_PER_DELIVERY;
    const weekEarnings = weekDeliveries.length * EARNING_PER_DELIVERY;
    const monthEarnings = monthDeliveries.length * EARNING_PER_DELIVERY;

    // Calculate last 30 days daily earnings
    const last30Days: { [key: string]: { amount: number; deliveries: number } } = {};
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days[dateStr] = { amount: 0, deliveries: 0 };
    }

    deliveries.forEach(delivery => {
      const deliveryDate = new Date(delivery.deliveryCompleted || delivery.updatedAt);
      const dateStr = deliveryDate.toISOString().split('T')[0];
      
      if (last30Days[dateStr]) {
        last30Days[dateStr].amount += EARNING_PER_DELIVERY;
        last30Days[dateStr].deliveries += 1;
      }
    });

    const last30DaysArray = Object.entries(last30Days).map(([date, data]) => ({
      date,
      amount: data.amount,
      deliveries: data.deliveries
    }));

    // Format transactions
    const transactions = deliveries.map(delivery => ({
      id: delivery.id,
      deliveryId: delivery.id,
      amount: EARNING_PER_DELIVERY,
      date: delivery.deliveryCompleted || delivery.updatedAt,
      bookTitle: delivery.borrowRequest?.book?.title || 'Unknown Book',
      status: 'COMPLETED'
    }));

    // Calculate pending earnings (assigned but not completed)
    const pendingDeliveries = await prisma.delivery.count({
      where: {
        agentId: req.userId,
        status: {
          in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        }
      }
    });

    const pendingEarnings = pendingDeliveries * EARNING_PER_DELIVERY;

    // Response data
    res.json({
      totalEarnings,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      completedDeliveries: deliveries.length,
      averagePerDelivery: EARNING_PER_DELIVERY,
      pendingEarnings,
      transactions,
      withdrawalHistory: [], // In production, fetch from database
      last30Days: last30DaysArray
    });

  } catch (error: any) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);