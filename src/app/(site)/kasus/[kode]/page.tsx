import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { CaseActions } from '@/components/case-actions'
import { CaseChat, type ChatMessage } from '@/components/case-chat'
import { Icon } from '@/components/icon'
import { Banner, Card, Chip, Meta, ProgressBar, Stamp, Stepper, TimelineItem } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getCaseForViewer } from '@/server/services/cases'
import { getDb, schema as s } from '@/server/db/client'
import { HttpError } from '@/server/http'
import { categoryLabel, USER_STEP_TEXT, USER_STEPS, userStepIndex } from '@/lib/labels'
import { fmtDate, fmtDateTime, fmtTime, remaining, rupiah } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'
import { bubbleShape } from '@/lib/wire-shape'

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
    <Reveal>
      <WireMemo shape={{ closed: closed ? 1 : 0, banners: (baru ? 1 : 0) + (closed ? 0 : 1), step, known: known.length, checking: checking.length, evidence: b.evidence.length, history: history.length, messages: Math.min(4, messages.length), ...bubbleShape(messages, 'pelapor'), share: b.share ? 1 : 0 }} />
      <div className="wx flex flex-col gap-8 pt-6 pb-16 lg:pt-10">
        <header className="flex flex-col gap-3">
          <Link href="/kasus" className="-ml-1 inline-flex min-h-9 items-center gap-1.5 self-start text-[14px] font-medium text-mut transition-colors hover:text-navy"><Icon name="back" size={17} />Kasus saya</Link>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-navy-d md:text-[36px]">Kasus <span className="font-mono font-medium tracking-normal">{c.code}</span></h1>
          <Meta
            className="text-[14px]"
            items={[
              categoryLabel(c.category, c.categoryOther),
              `Dibuka ${fmtDate(c.createdAt)}`,
              <Link key="awb" className="lnk font-mono font-medium" href={`/lacak/${b.shipment.awb}`}>{b.shipment.awb}</Link>,
            ]}
          />
        </header>

        {(baru || !closed) && (
          <div className="flex flex-col gap-2">
            {baru && <Banner tone="ok" icon="check" role="status"><p className="font-medium">Laporan terkirim. Kasus {c.code} sudah masuk ke admin ekspedisi.</p></Banner>}
            {!closed && <Banner tone="nb" icon="info" role="status"><p className="font-medium">Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.</p></Banner>}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
          <div className="flex min-w-0 flex-col gap-12">
            <Card className="flex flex-col gap-6 p-6">
              <Stepper steps={USER_STEPS} current={step} done={closed} />
              <p className="max-w-[62ch]"><span className="font-semibold">{USER_STEP_TEXT[c.status].title}</span> {USER_STEP_TEXT[c.status].body}</p>
              {!closed && (
                <div className="flex flex-col gap-3 border-t border-line pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Batas waktu tahap ini</span>
                    <Chip tone={rem.overdue ? 'er' : 'wn'} icon="clock">{rem.overdue ? rem.text : `Sisa ${rem.text}`}</Chip>
                  </div>
                  <ProgressBar value={used} tone={rem.overdue ? 'er' : 'navy'} label="Waktu terpakai" />
                  <span className="text-[13px] text-mut">Dari batas 3 hari per tahap. Bila terlewat, tombol eskalasi aktif.{c.escalatedAt ? ` Dieskalasi ${fmtDateTime(c.escalatedAt)}.` : ''}</span>
                </div>
              )}
              {closed && c.cause && <Banner tone="ok" icon="check"><p><span className="font-semibold">Penyebab:</span> {c.cause}</p></Banner>}
            </Card>

            <div className="grid gap-10 md:grid-cols-2">
              <section className="flex flex-col gap-3 border-t-2 border-ok pt-4">
                <h2 className="flex items-center gap-2 text-[17px] font-semibold"><Icon name="check" size={17} className="text-ok" />Yang kami ketahui</h2>
                <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-line-d">{known.map((k) => <li key={k}>{k}</li>)}</ul>
              </section>
              {checking.length > 0 && (
                <section className="flex flex-col gap-3 border-t-2 border-wn pt-4">
                  <h2 className="flex items-center gap-2 text-[17px] font-semibold"><Icon name="clock" size={17} className="text-wn" />Yang sedang kami periksa</h2>
                  <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-line-d">{checking.map((k) => <li key={k}>{k}</li>)}</ul>
                </section>
              )}
            </div>

            <section className="flex flex-col gap-4">
              <h2 className="text-[17px] font-semibold">Cerita Anda</h2>
              <div className="prose-story border-l-2 border-line-d pl-5 text-[16px] leading-relaxed" dangerouslySetInnerHTML={{ __html: c.storyHtml }} />
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-[17px] font-semibold">Bukti dalam kasus</h2>
              <ul className="border-t border-line">
                {b.evidence.length === 0 && <li className="border-b border-line py-3.5 text-mut">Tidak ada bukti dilampirkan.</li>}
                {b.evidence.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 border-b border-line py-3.5">
                    <span className="min-w-0 truncate">{e.ownerType === 'courier' ? (e.kind === 'handover' ? 'Bukti serah terima OTP' : 'Bukti pengambilan') : e.fileName}</span>
                    {e.ownerType === 'courier' ? <Chip tone="nb">Dicatat kurir</Chip> : <Chip tone="nu">Oleh Anda</Chip>}
                  </li>
                ))}
              </ul>
              <Stamp>Semua bukti memiliki cap integritas dan tidak dapat diubah.</Stamp>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-[17px] font-semibold">Riwayat kasus</h2>
              <ol className="m-0 list-none p-0">
                {history.map((a, i) => (
                  <TimelineItem key={a.id} tone={a.action === 'ditutup' ? 'ok' : a.action === 'eskalasi' ? 'er' : a.action === 'kasus_dibuat' ? 'ok' : 'nb'} icon={a.action === 'eskalasi' ? 'alert' : a.action === 'kasus_dibuat' || a.action === 'ditutup' ? 'check' : 'clock'} last={i === history.length - 1}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{a.detail}</span>
                      <span className="num text-[13px] text-mut">{fmtDateTime(a.createdAt)}, {a.actorId ? 'Admin ekspedisi' : a.actorLabel}</span>
                    </div>
                  </TimelineItem>
                ))}
              </ol>
            </section>

            <section className="flex flex-col gap-2 border-t border-line pt-6">
              <div className="flex items-center justify-between gap-2"><h2 className="text-[17px] font-semibold">Pengembalian dana</h2><Chip tone="nu">{c.refundStatus}</Chip></div>
              <p className="text-[14px] text-mut">Tahapannya: diajukan, disetujui, diproses, diterima. Jumlah <span className="num font-medium text-txt">{rupiah(b.shipment.itemValue)}</span>.</p>
            </section>
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
            <p className="text-[13px] text-mut">Terakhir diperbarui {fmtTime(new Date())} WIB.</p>
          </aside>
        </div>
      </div>
    </Reveal>
  )
}
