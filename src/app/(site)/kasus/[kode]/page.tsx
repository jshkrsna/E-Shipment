import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { CaseActions } from '@/components/case-actions'
import { CaseChat, type ChatMessage } from '@/components/case-chat'
import { Icon } from '@/components/icon'
import { Banner, Card, Chip, ProgressBar, Stamp, Stepper, TimelineItem } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getCaseForViewer } from '@/server/services/cases'
import { getDb, schema as s } from '@/server/db/client'
import { HttpError } from '@/server/http'
import { categoryLabel, USER_STEP_TEXT, USER_STEPS, userStepIndex } from '@/lib/labels'
import { fmtDate, fmtDateTime, fmtTime, remaining, rupiah } from '@/lib/format'

export async function generateMetadata({ params }: { params: Promise<{ kode: string }> }) {
  return { title: `Kasus ${(await params).kode.toUpperCase()}` }
}

const PUBLIC_ACTIONS = new Set(['kasus_dibuat', 'perbandingan_otomatis', 'status', 'keputusan', 'pengiriman_ulang', 'eskalasi', 'ditutup', 'tautan_bukti'])

export default async function KasusPage({ params, searchParams }: { params: Promise<{ kode: string }>; searchParams: Promise<{ baru?: string }> }) {
  const { kode } = await params
  const { baru } = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect(`/masuk?next=/kasus/${kode}`)
  if (user.role === 'ADMIN') redirect(`/admin/laporan/${kode.toUpperCase()}`)
  let b
  try {
    b = await getCaseForViewer(kode, user)
  } catch (e) {
    if (e instanceof HttpError) notFound()
    throw e
  }
  const c = b.case
  const db = await getDb()
  const checks = await db.select().from(s.identityChecks).where(eq(s.identityChecks.shipmentId, c.shipmentId)).orderBy(asc(s.identityChecks.seq))
  const first = checks.find((x) => x.isFirstMismatch)
  const lastOk = first ? [...checks].reverse().find((x) => x.seq < first.seq && x.result === 'match') : null
  const gap = checks.find((x) => x.result === 'not_scanned')
  const handover = await db.query.evidence.findFirst({ where: (e, { and, eq }) => and(eq(e.shipmentId, c.shipmentId), eq(e.kind, 'handover')) })

  const step = userStepIndex(c.status)
  const closed = c.status === 'SELESAI'
  const rem = remaining(c.stageDeadline)
  const total = c.stageDeadline.getTime() - c.stageStartedAt.getTime()
  const used = Math.min(100, Math.max(0, ((Date.now() - c.stageStartedAt.getTime()) / total) * 100))

  const known = [
    handover && `Serah terima ${fmtDateTime(handover.createdAt)} terverifikasi ${JSON.parse(handover.meta || '{}').metode?.replace('Konfirmasi ', '') ?? 'OTP'}.`,
    first && `Berat, ukuran, dan segel paket di ${first.hub} berbeda dari catatan pengambilan.`,
    gap && `${gap.hub} tidak memindai paket. ${gap.note ?? ''}`.trim(),
    `Nilai pesanan ${rupiah(b.shipment.itemValue)}.`,
  ].filter(Boolean) as string[]
  const checking = closed
    ? []
    : first
      ? [
          `Di mana tepatnya paket berganti, antara ${lastOk?.hub ?? 'titik pengambilan'} dan ${first.hub}.`,
          gap ? `Rekaman foto pindai di ${gap.hub}.` : 'Rekaman foto pindai di setiap hub.',
          'Catatan penanganan petugas pada jalur tersebut.',
        ]
      : ['Riwayat pindai dan bukti serah terima paket.', 'Bukti yang Anda lampirkan.', 'Catatan petugas di rute pengiriman.']

  const history = b.audit.filter((a) => PUBLIC_ACTIONS.has(a.action))
  const messages: ChatMessage[] = b.messages.map((m) => ({ id: m.id, senderRole: m.senderRole, kind: m.kind, body: m.body, createdAt: m.createdAt.toISOString() }))

  return (
    <div className="wx flex flex-col gap-4 py-4 lg:py-8">
      <div className="flex items-center gap-2">
        <Link href="/kasus" className="grid size-11 shrink-0 place-items-center rounded-r text-navy hover:bg-nu-bg" aria-label="Kembali ke daftar kasus"><Icon name="back" size={22} /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-extrabold md:text-[26px]">Kasus <span className="font-mono">{c.code}</span></h1>
          <p className="text-[12px] text-mut">{categoryLabel(c.category, c.categoryOther)} · dibuka {fmtDate(c.createdAt)} · <Link className="lnk" href={`/lacak/${b.shipment.awb}`}><span className="font-mono">{b.shipment.awb}</span></Link></p>
        </div>
      </div>

      {baru && <Banner tone="ok" icon="check" role="status"><p className="font-semibold">Laporan terkirim. Kasus {c.code} sudah masuk ke admin ekspedisi.</p></Banner>}
      {!closed && <Banner tone="nb" icon="info" role="status"><p className="font-semibold">Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.</p></Banner>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <Stepper steps={USER_STEPS} current={step} done={closed} />
            <p><b>{USER_STEP_TEXT[c.status].title}</b> {USER_STEP_TEXT[c.status].body}</p>
            {!closed && (
              <>
                <hr className="hr" />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">Batas waktu tahap ini</span>
                    <Chip tone={rem.overdue ? 'er' : 'wn'} icon="clock">{rem.overdue ? rem.text : `Sisa ${rem.text}`}</Chip>
                  </div>
                  <ProgressBar value={used} tone={rem.overdue ? 'er' : 'navy'} label="Waktu terpakai" />
                  <span className="text-[12px] text-mut">Dari batas 3 hari per tahap. Bila terlewat, tombol eskalasi aktif.{c.escalatedAt ? ` Dieskalasi ${fmtDateTime(c.escalatedAt)}.` : ''}</span>
                </div>
              </>
            )}
            {closed && c.cause && <Banner tone="ok" icon="check"><p className="text-[13px]"><b>Penyebab:</b> {c.cause}</p></Banner>}
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-[16px] font-bold text-ok"><Icon name="check" size={18} />Yang kami ketahui</h2>
              <ul className="flex list-disc flex-col gap-2 pl-5">{known.map((k) => <li key={k}>{k}</li>)}</ul>
            </Card>
            {checking.length > 0 && (
              <Card className="flex flex-col gap-2">
                <h2 className="flex items-center gap-2 text-[16px] font-bold text-wn"><Icon name="clock" size={18} />Yang sedang kami periksa</h2>
                <ul className="flex list-disc flex-col gap-2 pl-5">{checking.map((k) => <li key={k}>{k}</li>)}</ul>
              </Card>
            )}
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-bold">Cerita Anda</h2>
            <Card><div className="prose-story" dangerouslySetInnerHTML={{ __html: c.storyHtml }} /></Card>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-bold">Bukti dalam kasus</h2>
            <Card className="flex flex-col gap-3">
              {b.evidence.length === 0 && <p className="text-mut">Tidak ada bukti dilampirkan.</p>}
              {b.evidence.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{e.ownerType === 'courier' ? (e.kind === 'handover' ? 'Bukti serah terima OTP' : 'Bukti pengambilan') : e.fileName}</span>
                  {e.ownerType === 'courier' ? <Chip tone="nb">Dicatat kurir</Chip> : <Chip tone="nu">Oleh Anda</Chip>}
                </div>
              ))}
              <Stamp>Semua bukti memiliki cap integritas dan tidak dapat diubah.</Stamp>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[16px] font-bold">Riwayat kasus</h2>
            <ol className="m-0 list-none p-0">
              {history.map((a, i) => (
                <TimelineItem key={a.id} tone={a.action === 'ditutup' ? 'ok' : a.action === 'eskalasi' ? 'er' : a.action === 'kasus_dibuat' ? 'ok' : 'nb'} icon={a.action === 'kasus_dibuat' || a.action === 'ditutup' ? 'check' : 'clock'} last={i === history.length - 1}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{a.detail}</span>
                    <span className="text-[12px] text-mut">{fmtDateTime(a.createdAt)} · {a.actorId ? 'Admin ekspedisi' : a.actorLabel}</span>
                  </div>
                </TimelineItem>
              ))}
            </ol>
          </section>

          <Card className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2"><span className="font-semibold">Pengembalian dana</span><Chip tone="nu">{c.refundStatus}</Chip></div>
            <p className="text-[12px] text-mut">Diajukan, disetujui, diproses, diterima. Jumlah {rupiah(b.shipment.itemValue)}.</p>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="card flex max-h-[640px] flex-col p-0">
            <CaseChat code={c.code} initial={messages} viewer="pelapor" reporterLabel={b.reporter.masked} closed={closed} className="min-h-[420px]" />
          </div>
          <CaseActions
            code={c.code}
            share={b.share ? { token: b.share.token, expiresAt: b.share.expiresAt.toISOString() } : null}
            canEscalate={rem.overdue}
            escalated={!!c.escalatedAt}
            closed={closed}
          />
          <p className="note">Waktu terakhir diperbarui {fmtTime(new Date())} WIB.</p>
        </aside>
      </div>
    </div>
  )
}
