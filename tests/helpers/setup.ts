const noop = () => {};
const scopedLogger = Object.assign(noop, { error: noop, warn: noop });

vi.mock('@/lib/logger', () => ({
  logger: {
    repo: () => scopedLogger,
    service: () => scopedLogger,
    action: () => scopedLogger,
  },
}));
