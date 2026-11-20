import Link from 'next/link'
import { listAudit } from '@/server/services/admin'
import { fmtShort } from '@/lib/format'

export const metadata = { title: 'Log audit' }

export default async function AuditPage() {
  const rows = await listAudit(150)
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-extrabold md:text-[24px]">Log audit</h1>
        <p className="text-mut">Semua tindakan admin dan sistem, terbaru di atas. Log hanya dapat ditambah, tidak dapat diubah atau dihapus.</p>
      </div>
      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="tbl min-w-[720px]">
          <thead><tr><th>Waktu</th><th>Kasus</th><th>Kejadian</th><th>Pelaku</th></tr></thead>
          <tbody>
            {rows.map(({ a, code }) => (
              <tr key={a.id}>
                <td className="w-[140px] font-mono text-[12px]">{fmtShort(a.createdAt)}</td>
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
          <li key={a.id} className="card flex flex-col gap-1">
            <span className="text-[12px] text-mut"><span className="font-mono">{fmtShort(a.createdAt)}</span>{code && <> · <Link className="lnk font-mono" href={`/admin/laporan/${code}?tab=audit`}>{code}</Link></>}</span>
            <span>{a.detail}</span>
            <span className="text-[12px] text-mut">{a.actorLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
