import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageConfig, type BucketScope } from '@/config/storage.config';
import { r2 } from './client';

export type PresignedUpload = {
  url: string;
  key: string;
  bucket: string;
  expiresIn: number;
};

export async function createPresignedUploadUrl(
  scope: BucketScope,
  key: string,
  mime: string,
  size: number,
): Promise<PresignedUpload> {
  const bucket = storageConfig.buckets[scope].name;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mime,
    ContentLength: size,
  });
  const url = await getSignedUrl(r2, command, {
    expiresIn: storageConfig.upload.presignedUrlTtlSeconds,
  });
  return {
    url,
    key,
    bucket,
    expiresIn: storageConfig.upload.presignedUrlTtlSeconds,
  };
}
