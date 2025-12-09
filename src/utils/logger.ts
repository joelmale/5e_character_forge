import winston from 'winston';

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined; // Vite injects env via import.meta
const defaultLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';
const level: LogLevel = envLevel || defaultLevel;

const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level: lvl, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${lvl}: ${message}${metaString ? ` ${metaString}` : ''}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleTransport = new winston.transports.Console({
  level,
  format: import.meta.env.DEV ? prettyFormat : jsonFormat,
});

const baseLogger = winston.createLogger({
  level,
  transports: [consoleTransport],
  defaultMeta: {
    app: '5e-character-forge',
    env: import.meta.env.MODE,
  },
});

// Thin wrapper for consistent imports
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => baseLogger.error(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => baseLogger.warn(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => baseLogger.info(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => baseLogger.debug(message, meta),
  child: (meta: Record<string, unknown>) => baseLogger.child(meta),
};

export type Logger = typeof log;
