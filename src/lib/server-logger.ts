import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Structured server-side logger using pino.
 *
 * - JSON output in production (for log aggregation services)
 * - Pretty-printed output in development
 * - Environment-based log level via LOG_LEVEL env var
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
})

/**
 * Create a child logger with request context.
 */
export function createRequestLogger(context: {
  userId?: number | null
  orgId?: number | null
  procedure?: string
}) {
  return logger.child({
    userId: context.userId ?? undefined,
    orgId: context.orgId ?? undefined,
    procedure: context.procedure ?? undefined,
  })
}
