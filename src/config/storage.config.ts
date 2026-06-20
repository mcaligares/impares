import { appConfig } from './app.config';

export const storageConfig = {
  buckets: {
    public: {
      name: process.env.STORAGE_BUCKET_PUBLIC ?? '',
      publicUrl: process.env.STORAGE_PUBLIC_URL ?? '',
    },
    private: {
      name: process.env.STORAGE_BUCKET_PRIVATE ?? '',
    },
  },
  accountId: process.env.STORAGE_ACCOUNT_ID ?? '',
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
  upload: {
    maxSizeBytes: appConfig.upload.maxSizeBytes,
    allowedMimeTypes: appConfig.upload.allowedMimeTypes,
    presignedUrlTtlSeconds: appConfig.upload.presignedUrlTtlSeconds,
  },
} as const;

export type BucketScope = keyof typeof storageConfig.buckets;
