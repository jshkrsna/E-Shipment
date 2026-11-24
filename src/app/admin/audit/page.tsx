import Link from 'next/link'
import { listAudit } from '@/server/services/admin'
import { fmtShort } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Log audit' }

export default async function AuditPage() {
  const rows = await listAudit(150)
  return (
    <Reveal>
      <WireMemo shape={{ rows: rows.length }} />
      <div className="flex flex-col gap-8 px-4 py-6 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] leading-tight font-semibold md:text-[28px]">Log audit</h1>
          <p className="text-mut">Semua tindakan admin dan sistem, terbaru di atas. Log hanya dapat ditambah, tidak dapat diubah atau dihapus.</p>
        </div>
        <div className="card hidden overflow-x-auto p-0 md:block">
          <table className="tbl min-w-[720px]">
            <thead><tr><th>Waktu</th><th>Kasus</th><th>Kejadian</th><th>Pelaku</th></tr></thead>
            <tbody>
              {rows.map(({ a, code }) => (
                <tr key={a.id}>
                  <td className="w-[140px] font-mono text-[13px]">{fmtShort(a.createdAt)}</td>
                  <td className="font-mono">{code ? <Link className="lnk" href={`/admin/laporan/${code}?tab=audit`}>{code}</Link> : '–'}</td>
                  <td>{a.detail}</td>
                  <td className="text-mut">{a.actorLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-2 md:hidden">
          {rows.map(({ a, code }) => (
            <li key={a.id} className="flex flex-col gap-1 border-b border-line py-3.5 first:border-t">
              <span className="text-[13px] text-mut"><span className="font-mono">{fmtShort(a.createdAt)}</span>{code && <> · <Link className="lnk font-mono" href={`/admin/laporan/${code}?tab=audit`}>{code}</Link></>}</span>
              <span>{a.detail}</span>
              <span className="text-[13px] text-mut">{a.actorLabel}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
