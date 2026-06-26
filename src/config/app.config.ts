export const appConfig = {
  name: 'My App',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
  share: {
    matchInvite: 'Miren este partido que armé:',
  },
  defaultCurrency: 'ARS',
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  guest: {
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
