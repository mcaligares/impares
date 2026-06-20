import { S3Client } from '@aws-sdk/client-s3';
import { storageConfig } from '@/config/storage.config';
import { ConfigurationError } from '@/lib/errors';

export const storageEnabled =
  !!storageConfig.accountId &&
  !!storageConfig.accessKeyId &&
  !!storageConfig.secretAccessKey;

function createDisabledClient(): S3Client {
  return new Proxy({} as S3Client, {
    get: () => {
      throw new ConfigurationError(
        'Storage module requires STORAGE_ACCOUNT_ID, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY',
      );
    },
  });
}

export const r2: S3Client = storageEnabled
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${storageConfig.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: storageConfig.accessKeyId,
        secretAccessKey: storageConfig.secretAccessKey,
      },
    })
  : createDisabledClient();
