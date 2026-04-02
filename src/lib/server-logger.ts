import pino from 'pino'
import type { db as dbType } from '@/db'
import { auditLogs } from '@/db/schema'
import type { AuditAction, EntityType } from './events'

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

// --- Audit logging ---

interface AuditParams {
  userId: string | null | undefined
  action: AuditAction
  entityType: EntityType
  entityId?: string
  details?: Record<string, unknown>
}

/**
 * Insert an audit log entry into the database and emit a structured log line.
 */
export async function logAudit(
  db: typeof dbType,
  { userId, action, entityType, entityId, details }: AuditParams
) {
  logger.info(
    { audit: true, userId, action, entityType, entityId },
    `audit: ${action} ${entityType}`
  )

  await db.insert(auditLogs).values({
    userId: userId ?? null,
    action,
    entityType,
    entityId: entityId ?? null,
    details: details ? JSON.stringify(details) : null,
  })
}
