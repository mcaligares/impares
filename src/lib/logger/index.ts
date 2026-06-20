import { loggerConfig } from '@/config/logger.config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

const CURRENT_LEVEL: LogLevel = loggerConfig.level;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_VALUES[level] <= LOG_LEVEL_VALUES[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, layer: string, name: string, method: string, message: string, data?: unknown): string {
  const base = `[${level.charAt(0).toUpperCase()}] [${layer}] ${name}.${method} — ${message}`;
  return data !== undefined ? `${base} | ${JSON.stringify(data)}` : base;
}

type ScopedLogger = {
  (method: string, message: string, data?: unknown): void;
  error: (method: string, message: string, data?: unknown) => void;
  warn: (method: string, message: string, data?: unknown) => void;
};

function createScopedLogger(name: string, layer: string, level: LogLevel): ScopedLogger {
  const log: ScopedLogger = Object.assign(
    (method: string, message: string, data?: unknown) => {
      if (!shouldLog(level)) return;
      const formatted = formatMessage(level, layer, name, method, message, data);
      console.log(formatted);
    },
    {
      error: (method: string, message: string, data?: unknown) => {
        if (!shouldLog('error')) return;
        const formatted = formatMessage('error', 'ERROR', name, method, message, data);
        console.error(formatted);
      },
      warn: (method: string, message: string, data?: unknown) => {
        if (!shouldLog('warn')) return;
        const formatted = formatMessage('warn', layer, name, method, message, data);
        console.warn(formatted);
      },
    }
  );
  return log;
}

export const logger = {
  repo: (name: string) => createScopedLogger(name, 'REPOSITORY', 'verbose'),
  service: (name: string) => createScopedLogger(name, 'SERVICE', 'debug'),
  action: (name: string) => createScopedLogger(name, 'ACTION', 'info'),
};
