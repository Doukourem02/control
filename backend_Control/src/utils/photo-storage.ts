import { AppwriteException, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { storage } from '../config/appwrite';
import { userError } from './http';

const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function decodeBase64Photo(
  rawBase64: unknown,
  mimeType: unknown,
  maxBytes: number
): { buffer: Buffer; mimeType: string } | null {
  if (typeof rawBase64 !== 'string' || !rawBase64.trim()) return null;

  const type = typeof mimeType === 'string' && ALLOWED_PHOTO_MIME.includes(mimeType) ? mimeType : 'image/jpeg';
  const base64 = rawBase64.includes(',') ? rawBase64.split(',').pop()! : rawBase64;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    throw userError('Photo invalide.', 400, 'PHOTO_INVALID');
  }

  if (buffer.length === 0) {
    throw userError('Photo invalide.', 400, 'PHOTO_INVALID');
  }

  if (buffer.length > maxBytes) {
    throw userError(`La photo est trop lourde (${Math.round(maxBytes / (1024 * 1024))} Mo max).`, 400, 'PHOTO_TOO_LARGE');
  }

  return { buffer, mimeType: type };
}

export async function uploadPhoto(bucketId: string, buffer: Buffer, filename: string): Promise<string> {
  const file = await storage.createFile({
    bucketId,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(buffer, filename),
  });

  return file.$id;
}

export async function replacePhoto(
  bucketId: string,
  previousFileId: string | undefined,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const fileId = await uploadPhoto(bucketId, buffer, filename);

  if (previousFileId) {
    await storage.deleteFile({ bucketId, fileId: previousFileId }).catch(() => {});
  }

  return fileId;
}

export async function getPhotoFile(
  bucketId: string,
  fileId: string
): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  try {
    const [bytes, meta] = await Promise.all([
      storage.getFileView({ bucketId, fileId }),
      storage.getFile({ bucketId, fileId }),
    ]);

    return { bytes, mimeType: meta.mimeType };
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return null;
    throw error;
  }
}
