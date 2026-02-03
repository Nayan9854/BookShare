// src/pages/api/books/[id]/upload-cover.ts - CLOUDINARY VERSION
import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../../../../lib/cloudinary';

// Configure multer to use memory storage (no local files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Disable Next.js body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Promisify multer
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Check if book exists and user owns it
    const book = await prisma.book.findUnique({
      where: { id: Number(id) }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.ownerId !== req.userId) {
      return res.status(403).json({ 
        error: 'You can only upload covers for your own books' 
      });
    }

    // Parse the uploaded file using multer
    await runMiddleware(req, res, upload.single('cover'));

    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ error: 'No cover image provided' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.buffer);

    // Delete old image from Cloudinary if exists
    if (book.coverImage) {
      const oldPublicId = extractPublicId(book.coverImage);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Update book with new Cloudinary URL
    const updatedBook = await prisma.book.update({
      where: { id: Number(id) },
      data: { coverImage: result.secure_url },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        holder: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      message: 'Cover image uploaded successfully',
      book: updatedBook,
      coverUrl: result.secure_url
    });
  } catch (error: any) {
    console.error('Upload cover error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload cover image' 
    });
  }
}

export default withAuth(handler);