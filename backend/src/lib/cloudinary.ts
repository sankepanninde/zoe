import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// ===========================================
// UPLOAD AVATAR
// ===========================================

export interface UploadAvatarResult {
  url: string;
  publicId: string;
}

export async function uploadAvatar(
  buffer: Buffer,
  userId: string
): Promise<UploadAvatarResult> {
  if (!isConfigured) {
    const err = new Error(
      'Cloudinary no está configurado. Contacta al administrador.'
    );
    (err as Error & { statusCode: number }).statusCode = 503;
    throw err;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'zoe/avatars',
        public_id: `user_${userId}`,
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          console.error('[cloudinary] Error subiendo avatar:', error);
          const err = new Error('Error al subir la imagen');
          (err as Error & { statusCode: number }).statusCode = 500;
          reject(err);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

// ===========================================
// DELETE AVATAR
// ===========================================

export async function deleteAvatar(userId: string): Promise<void> {
  if (!isConfigured) return;

  try {
    await cloudinary.uploader.destroy(`zoe/avatars/user_${userId}`, {
      invalidate: true,
    });
  } catch (err) {
    console.warn('[cloudinary] Error borrando avatar:', err);
  }
}

// ===========================================
// HEALTH CHECK
// ===========================================

export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}