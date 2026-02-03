// src/pages/api/auth/register-agent.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, phoneNumber, vehicleType, licenseNumber } = req.body;

  // Validation
  if (!name || !email || !password || !phoneNumber || !vehicleType) {
    return res.status(400).json({ 
      error: 'Name, email, password, phone number, and vehicle type are required' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with DELIVERY_AGENT role and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'DELIVERY_AGENT'
        }
      });

      // Create delivery agent profile
      const profile = await tx.deliveryAgentProfile.create({
        data: {
          userId: user.id,
          phoneNumber,
          vehicleType,
          licenseNumber: licenseNumber || null,
          isAvailable: true,
          rating: 5.0,
          totalDeliveries: 0
        }
      });

      return { user, profile };
    });

    res.status(201).json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      },
      profile: result.profile
    });
  } catch (error: any) {
    console.error('Agent registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}