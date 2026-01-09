import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false
        }
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    service: 'fresh-dessert-app'
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`
});

export const logRequest = (data: Record<string, unknown>) => {
  logger.info(data);
};

export const logError = (data: Record<string, unknown>) => {
  logger.error(data);
};