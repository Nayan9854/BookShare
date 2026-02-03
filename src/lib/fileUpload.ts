// src/lib/fileUpload.ts
import formidable, { File } from 'formidable';
import { NextApiRequest } from 'next';
import fs from 'fs';
import path from 'path';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export interface ParsedForm {
  fields: formidable.Fields;
  files: formidable.Files;
}

/**
 * Parse multipart form data with file uploads
 */
export async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB max
    filter: ({ mimetype }) => {
      // Only allow image files
      return mimetype?.startsWith('image/') || false;
    }
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
}

/**
 * Save uploaded file and return public URL
 */
export function saveUploadedFile(file: File): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const ext = path.extname(file.originalFilename || '');
  const newFilename = `${timestamp}-${randomString}${ext}`;
  const newPath = path.join(uploadDir, newFilename);

  // Move file to permanent location
  fs.renameSync(file.filepath, newPath);

  // Return public URL
  return `/uploads/${newFilename}`;
}

/**
 * Delete uploaded file
 */
export function deleteUploadedFile(url: string): void {
  try {
    const filename = url.split('/').pop();
    if (filename) {
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}