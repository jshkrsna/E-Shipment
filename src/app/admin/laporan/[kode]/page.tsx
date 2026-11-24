import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AcceptButton, CaseControls, CustomerMessage, NotesForm } from '@/components/admin/case-tools'
import { ValidationCard } from '@/components/admin/validation-card'
import { CaseChat, type ChatMessage } from '@/components/case-chat'
import { Icon } from '@/components/icon'
import { eventVisual } from '@/components/tracking'
import { Banner, Card, Chip, Meta, TimelineItem, cx } from '@/components/ui'
import { getAdminCase } from '@/server/services/admin'
import { HttpError } from '@/server/http'
import { adminStatus, categoryLabel, STATUS_DETAIL } from '@/lib/labels'
import { dims, fmtDateTime, fmtRelativeDay, fmtShort, kg, remaining, rupiah } from '@/lib/format'
import type { TraceLoc } from '@/lib/validation'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'
import { PendingBody, PendingLink, PendingScope } from '@/components/wire/pending'
import { AdminCaseTabWire } from '@/components/wire/admin'
import { bubbleShape } from '@/lib/wire-shape'

export async function generateMetadata({ params }: { params: Promise<{ kode: string }> }) {
  return { title: `Kasus ${(await params).kode.toUpperCase()}` }
}

const TABS = [
  { key: 'laporan', label: 'Laporan & validasi' },
  { key: 'investigasi', label: 'Investigasi' },
  { key: 'audit', label: 'Jejak audit' },
] as const

export default async function AdminCasePage({ params, searchParams }: { params: Promise<{ kode: string }>; searchParams: Promise<{ tab?: string; hub?: string }> }) {
  const { kode } = await params
  const { tab: tabParam, hub } = await searchParams
  const tab = TABS.find((t) => t.key === tabParam)?.key ?? 'laporan'
  let d
  try {
    d = await getAdminCase(kode)
  } catch (e) {
    if (e instanceof HttpError) notFound()
    throw e
  }
  const c = d.case
  const st = adminStatus(c.status)
  const closed = c.status === 'SELESAI'
  const rem = remaining(c.stageDeadline)
  const userFiles = d.evidence.filter((e) => e.ownerType === 'user')
  const messages: ChatMessage[] = d.messages.map((m) => ({ id: m.id, senderRole: m.senderRole, kind: m.kind, body: m.body, createdAt: m.createdAt.toISOString() }))
  const base = `/admin/laporan/${c.code}`

  // Perbandingan identitas (eks O3)
  const ref = d.checks.find((x) => x.result === 'reference')
  const scanned = d.checks.filter((x) => x.result === 'match' || x.result === 'mismatch')
  const selHub = scanned.find((x) => String(x.id) === hub) ?? scanned.find((x) => x.isFirstMismatch) ?? scanned[0]
  const lastMatch = d.checks.filter((x) => x.result === 'match' && selHub && x.seq < selHub.seq).at(-1)

  return (
    <Reveal>
      <WireMemo scope={`/admin/laporan/${c.code}`} shape={{ baru: c.status === 'BARU' ? 1 : 0, evidence: d.evidence.length, messages: Math.min(4, messages.length), ...bubbleShape(messages, 'admin') }} />
      <WireMemo shape={{ events: d.events.length, bad: d.events.findIndex((e) => e.isFirstMismatch), gap: d.events.findIndex((e) => e.kind === 'no_scan'), hubs: scanned.length, notes: d.notes.length, audit: d.audit.length }} />
      <div className="flex flex-col xl:h-full xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6 lg:p-8">
          <Link href="/admin/laporan" className="lnk flex items-center gap-1 self-start text-[13px] lg:hidden"><Icon name="back" size={16} />Semua laporan</Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="text-[22px] leading-tight font-semibold md:text-[26px]"><span className="font-mono font-medium">{c.code}</span><span className="ml-3 text-mut">{categoryLabel(c.category, c.categoryOther)}</span></h2>
              <Meta
                items={[
                  <Link key="awb" className="lnk font-mono font-medium" href={`/lacak/${d.shipment.awb}`}>{d.shipment.awb}</Link>,
                  `${d.shipment.courier} (sesuai laporan)`,
                  <span key="v" className="num">{rupiah(d.shipment.itemValue)}</span>,
                ]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip tone={st.tone}>{c.status === 'BARU' ? 'Baru' : STATUS_DETAIL[c.status]}</Chip>
              {!closed && <Chip tone={rem.overdue ? 'er' : 'wn'} icon="clock">Batas waktu: {rem.text}</Chip>}
              {c.escalatedAt && <Chip tone="er" icon="alert">Dieskalasi</Chip>}
            </div>
          </div>
          {c.status === 'BARU' && <AcceptButton code={c.code} />}

          <PendingScope>
          <nav className="flex gap-7 overflow-x-auto border-b border-line" aria-label="Bagian kasus">
            {TABS.map((t) => (
              <PendingLink key={t.key} href={t.key === 'laporan' ? base : `${base}?tab=${t.key}`} aria-current={tab === t.key ? 'page' : undefined} className={cx('-mb-px flex min-h-12 items-center border-b-2 font-medium whitespace-nowrap transition-colors data-[pending]:text-navy', tab === t.key ? 'border-navy text-navy' : 'border-transparent text-mut hover:text-navy')}>
                {t.label}
              </PendingLink>
            ))}
          </nav>

          <PendingBody fallback={<AdminCaseTabWire />}>

          {tab === 'laporan' && (
            <>
              <Card className="flex flex-col gap-3">
                <h3 className="text-[17px] font-semibold">Laporan dari penerima</h3>
                <div className="prose-story border-l-2 border-line-d pl-4 text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: c.storyHtml }} />
                <Meta
                  items={[
                    `${d.evidence.length} berkas lampiran`,
                    `Pelapor ${d.reporter.masked}`,
                    `Masuk ${fmtRelativeDay(c.createdAt).toLowerCase()}`,
                    `Kontak lewat ${c.contactChannel === 'whatsapp' ? 'WhatsApp' : 'email'}`,
                  ]}
                />
                {d.evidence.length > 0 && (
                  <ul className="flex flex-col gap-2 border-t border-line pt-4 text-[14px]">
                    {d.evidence.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2">
                        {e.storageKey ? (
                          <a className="lnk truncate" href={`/api/evidence/${e.id}/file`} target="_blank" rel="noreferrer">{e.fileName}</a>
                        ) : (
                          <span className="truncate">{e.ownerType === 'courier' ? (e.kind === 'handover' ? 'Bukti serah terima OTP' : 'Bukti pengambilan') : e.fileName}</span>
                        )}
                        <Chip tone={e.ownerType === 'courier' ? 'nb' : 'nu'}>{e.ownerType === 'courier' ? 'Dicatat kurir' : 'Oleh pelapor'}</Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <ValidationCard
                code={c.code}
                status={c.status}
                initial={{
                  damaged: d.validation?.damaged ?? null,
                  insurance: (d.validation?.insurance as 'asuransi' | 'tanpa_asuransi' | null) ?? null,
                  chargeRuleId: d.validation?.chargeRuleId ?? null,
                  chargeManual: d.validation?.chargeManual ?? null,
                  swapped: d.validation?.swapped ?? null,
                }}
                rules={d.rules}
                trace={d.trace.map((t) => ({ id: t.id, name: t.name, status: t.status })) as TraceLoc[]}
                itemValue={d.shipment.itemValue}
                decisionSentAt={d.validation?.decisionSentAt?.toISOString() ?? null}
                redeliveryAt={d.validation?.redeliveryAt?.toISOString() ?? null}
              />
              {userFiles.length === 0 && <p className="note">Pelapor tidak melampirkan foto unboxing.</p>}
            </>
          )}

          {tab === 'investigasi' && (
            <div className="grid gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="flex flex-col gap-3">
                <h3 className="text-[17px] font-semibold">Linimasa dengan anomali</h3>
                <ol className="m-0 list-none p-0">
                  {d.events.map((e, i) => {
                    const v = eventVisual(e)
                    return (
                      <TimelineItem key={e.id} tone={v.tone} icon={v.icon} dashed={e.kind === 'no_scan'} last={i === d.events.length - 1}>
                        <div className={cx('flex flex-col', e.isFirstMismatch && 'gap-1 rounded-r border-l-2 border-er bg-er-bg/70 px-3 py-2')}>
                          {e.isFirstMismatch && <Chip tone="er" className="self-start bg-white">Ketidakcocokan pertama</Chip>}
                          <span className={cx('font-semibold', e.kind === 'no_scan' && 'text-wn')}>
                            {e.title}{e.kind === 'hub_scan' && !e.isFirstMismatch ? ` · ${e.identityResult === 'match' ? 'cocok' : 'tidak cocok'}` : ''}
                          </span>
                          <span className="text-[13px] text-mut">{fmtShort(e.occurredAt)}{e.actor ? ` · ${e.actor.toLowerCase()}` : e.kind === 'no_scan' ? ` · ${e.location}` : ''}</span>
                        </div>
                      </TimelineItem>
                    )
                  })}
                </ol>
              </Card>
              <div className="flex min-w-0 flex-col gap-4">
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[17px] font-semibold">Diharapkan vs dipindai</h3>
                    <div className="flex flex-wrap gap-2">
                      {scanned.map((x) => (
                        <PendingLink key={x.id} href={`${base}?tab=investigasi&hub=${x.id}`} className={cx('inline-flex min-h-9 items-center rounded-full border px-3 text-[13px] font-medium transition-colors', selHub?.id === x.id ? 'border-navy bg-navy text-white' : 'border-line-d bg-white text-nu hover:border-navy hover:text-navy')}>
                          {x.hub.replace('Transit ', '')}
                        </PendingLink>
                      ))}
                    </div>
                  </div>
                  {ref && selHub ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="tbl min-w-[520px]">
                          <thead><tr><th>Atribut</th><th>Diharapkan (pengambilan)</th><th>Dipindai ({selHub.hub.replace('Transit ', '')})</th><th>Hasil</th></tr></thead>
                          <tbody>
                            {(
                              [
                                ['Berat', kg(ref.weightKg), kg(selHub.weightKg), Math.abs((selHub.weightKg ?? 0) - (ref.weightKg ?? 0)) > (ref.weightKg ?? 0) * 0.02 + 0.005],
                                ['Ukuran', dims(ref.lengthCm, ref.widthCm, ref.heightCm), dims(selHub.lengthCm, selHub.widthCm, selHub.heightCm), dims(ref.lengthCm, ref.widthCm, ref.heightCm) !== dims(selHub.lengthCm, selHub.widthCm, selHub.heightCm)],
                                ['Nomor segel', ref.sealNo, selHub.sealNo, ref.sealNo !== selHub.sealNo],
                              ] as [string, string, string, boolean][]
                            ).map(([k, a, b, diff]) => (
                              <tr key={k}>
                                <td className="font-semibold">{k}</td>
                                <td className={k === 'Nomor segel' ? 'font-mono' : ''}>{a}</td>
                                <td className={cx(k === 'Nomor segel' && 'font-mono', diff && 'diff')}>{b}</td>
                                <td>{diff ? <Chip tone="er" icon="x">Beda</Chip> : <Chip tone="ok" icon="check">Sama</Chip>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {selHub.result === 'mismatch' ? (
                        <Banner tone="er" icon="flag">
                          <p>Paket di {selHub.hub} berbeda dari paket saat diambil.{lastMatch ? ` ${lastMatch.hub} sebelumnya cocok, jadi pertukaran terjadi di antara kedua hub.` : ''}</p>
                        </Banner>
                      ) : (
                        <Banner tone="ok" icon="check"><p>Identitas paket di {selHub.hub} cocok dengan catatan pengambilan.</p></Banner>
                      )}
                    </>
                  ) : (
                    <p className="text-mut">Belum ada hasil pindai hub untuk dibandingkan.</p>
                  )}
                  <Link href="/admin/pindai" className="lnk self-start text-[13px]">Catat pindai checkpoint baru</Link>
                </Card>
                <div className="grid gap-4 md:grid-cols-2">
                  <CaseControls code={c.code} status={c.status} assigneeId={c.assigneeId} admins={d.admins} cause={c.cause} closed={closed} />
                  <Card className="flex flex-col gap-3">
                    <h3 className="text-[17px] font-semibold">Catatan internal</h3>
                    <NotesForm code={c.code} />
                    <ul className="flex flex-col gap-2">
                      {d.notes.map((n) => (
                        <li key={n.id} className="border-l-2 border-line-d py-1 pl-3 text-[14px]">
                          <p>{n.body}</p>
                          <p className="mt-1 text-[13px] text-mut">{n.author}, <span className="num">{fmtDateTime(n.createdAt)}</span></p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
                <CustomerMessage code={c.code} disabled={closed} />
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <Card className="overflow-x-auto p-0">
              <table className="tbl min-w-[560px]">
                <thead><tr><th>Waktu</th><th>Kejadian</th><th>Pelaku</th></tr></thead>
                <tbody>
                  {d.audit.map((a) => (
                    <tr key={a.id}><td className="num w-[160px] text-[13px] text-mut">{fmtShort(a.createdAt)}</td><td>{a.detail}</td><td className="text-mut">{a.actorLabel}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="note m-4">Setiap perubahan status dicatat dengan pelaku dan waktu. Log tidak dapat diubah.</p>
            </Card>
          )}
          </PendingBody>
          </PendingScope>
        </div>

        <aside className="border-t border-line bg-white xl:sticky xl:top-0 xl:h-dvh xl:w-[360px] xl:shrink-0 xl:border-t-0 xl:border-l">
          <CaseChat code={c.code} initial={messages} viewer="admin" reporterLabel={d.reporter.masked} closed={closed} className="h-full max-h-[720px] xl:max-h-none" />
        </aside>
      </div>
    </Reveal>
  )
}
