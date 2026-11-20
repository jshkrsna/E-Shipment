import 'server-only'
import type { DB } from '../db/client'
import { schema as s } from '../db/client'

type Tx = Pick<DB, 'insert'>

export async function audit(
  tx: Tx,
  entry: { caseId?: number | null; actor?: { id: number; name: string } | null; action: string; detail: string },
) {
  await tx.insert(s.auditLogs).values({
    caseId: entry.caseId ?? null,
    actorId: entry.actor?.id ?? null,
    actorLabel: entry.actor?.name ?? 'Sistem',
    action: entry.action,
    detail: entry.detail,
  })
}

export async function systemMessage(tx: Tx, caseId: number, body: string) {
  await tx.insert(s.messages).values({ caseId, senderRole: 'sistem', kind: 'status', body })
}
