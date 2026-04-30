import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config';

/**
 * Map file format strings to MIME content types.
 */
const FORMAT_CONTENT_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  midi: 'audio/midi',
  csv: 'text/csv',
  other: 'application/octet-stream',
};

const s3Client = new S3Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

/**
 * Generates a pre-signed S3 upload URL for a given file name and format.
 *
 * The S3 key is constructed as `uploads/<uuid>/<fileName>` to ensure uniqueness
 * while preserving the original file name for readability.
 *
 * @param fileName - The original file name (e.g., "track1.wav")
 * @param format - The file format (e.g., "wav", "mp3", "midi", "csv", "other")
 * @returns An object containing the pre-signed upload URL and the S3 object key
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  format: string,
): Promise<{ uploadUrl: string; key: string }> {
  const key = `uploads/${randomUUID()}/${fileName}`;
  const contentType = FORMAT_CONTENT_TYPES[format] || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: config.s3PresignExpiresIn,
  });

  return { uploadUrl, key };
}
