export const appConfig = {
  name: 'My App',
  defaultCurrency: 'ARS',
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  voter: {
    nameMaxLength: 40,
  },
  upload: {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ],
    presignedUrlTtlSeconds: 300,
  },
} as const;
