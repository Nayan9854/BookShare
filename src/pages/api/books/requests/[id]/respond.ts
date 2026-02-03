// src/pages/api/requests/[id]/respond.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Ensure the method is PATCH
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Get identifiers and action from the request
  // In a real app, userId would come from a verified session/token, not a header.
  const userId = req.headers['x-user-id'];
  const { id } = req.query;
  const { action } = req.body;

  // 3. Basic Validation
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: "Invalid action. Must be ACCEPT or REJECT" });
  }

  try {
    // 4. Find the borrow request and include the book to verify the owner
    const request = await prisma.borrowRequest.findUnique({
      where: { id: Number(id) },
      include: {
        book: true // We need the book to check its ownerId
      }
    });

    // 5. Perform sequential checks
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.book.ownerId !== Number(userId)) {
      return res.status(403).json({ error: "You can only respond to requests for your own books" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "This request has already been responded to" });
    }

    // 6. Process the action
    if (action === "ACCEPT") {
      // Use a transaction to ensure both updates succeed or fail together
      const [updatedRequest] = await prisma.$transaction([
        // First, update the BorrowRequest
        prisma.borrowRequest.update({
          where: { id: Number(id) },
          data: { status: "ACCEPTED" },
          // Include related data for a rich response
          include: {
            book: {
              include: {
                owner: { select: { id: true, name: true } },
                holder: { select: { id: true, name: true } }
              }
            },
            borrower: { select: { id: true, name: true } }
          }
        }),
        // Second, update the Book's status and current holder
        prisma.book.update({
          where: { id: request.bookId },
          data: {
            status: "BORROWED",
            userId: request.borrowerId // Assign the book to the borrower
          }
        })
      ]);

      // --- This is the completed part ---
      return res.status(200).json({
        message: "Request accepted successfully",
        request: updatedRequest
      });
      // ------------------------------------

    } else if (action === "REJECT") {
      const updatedRequest = await prisma.borrowRequest.update({
        where: { id: Number(id) },
        data: { status: "REJECTED" },
      });

      return res.status(200).json({
        message: "Request rejected successfully",
        request: updatedRequest
      });
    }

  } catch (err: any) {
    console.error("Error responding to request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}