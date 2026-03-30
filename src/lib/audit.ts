import type { db as dbType } from '@/db'
import { auditLogs } from '@/db/schema'

interface AuditParams {
  userId: string | null | undefined
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}

export async function logAudit(
  db: typeof dbType,
  { userId, action, entityType, entityId, details }: AuditParams
) {
  await db.insert(auditLogs).values({
    userId: userId ?? null,
    action,
    entityType,
    entityId: entityId ?? null,
    details: details ? JSON.stringify(details) : null,
  })
}
