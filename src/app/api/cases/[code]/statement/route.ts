import { route } from '@/server/http'
import { requireUser } from '@/server/services/auth'
import { getCaseForViewer } from '@/server/services/cases'
import { caseStatementPdf } from '@/server/services/pdf'

export const GET = route<{ code: string }>(async (_req, { code }) => {
  const bundle = await getCaseForViewer(code, await requireUser())
  const bytes = await caseStatementPdf(bundle)
  return new Response(Buffer.from(bytes), {
    headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="Pernyataan-${bundle.case.code}.pdf"` },
  })
})
