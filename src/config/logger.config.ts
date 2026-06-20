export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export const loggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'verbose'),
} as const;
