import Link from 'next/link'
import type { IdentityCheck, ShipmentEvent } from '@/server/db/schema'
import type { Tracking } from '@/server/services/shipments'
import { dims, fmtDate, fmtDateTime, fmtShort, fmtTime, kg } from '@/lib/format'
import { Banner, Card, Chip, KV, TimelineItem } from './ui'
import { Icon } from './icon'

/** Ringkasan paket tanpa kotak: resi besar, status, lalu baris data. */
export function StatusCard({ t }: { t: Tracking }) {
  const s = t.shipment
  const delivered = s.status === 'Diterima'
  const verified = delivered && (s.statusSource === 'OTP' || s.statusSource === 'QR')
  return (
    <section className="flex flex-col gap-6" aria-label="Ringkasan paket">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[22px] leading-none font-medium tracking-[-0.01em] break-all text-navy md:text-[26px]">{s.awb}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{s.status}</span>
          {verified ? (
            <Chip tone="ok" icon="shield">Terverifikasi</Chip>
          ) : delivered ? (
            <Chip tone="wn" icon="alert">Tanpa bukti</Chip>
          ) : (
            <Chip tone="nb" icon="pin">Dalam proses</Chip>
          )}
        </div>
        {s.statusAt && (
          <p className="num text-mut">
            {delivered ? `Diverifikasi ${s.statusSource} pukul ${fmtTime(s.statusAt)}, ${fmtDate(s.statusAt)}` : `${s.statusSource}, ${fmtDateTime(s.statusAt)}`}
          </p>
        )}
      </div>
      <div className="border-t border-line pt-5">
        <KV
          rows={[
            ['Layanan', `${s.courier} (sesuai laporan), ${s.service}`],
            ['Asal', s.origin],
            ['Tujuan', s.destination],
            ['Penerima', s.recipient],
            ['Estimasi', s.eta ? `${fmtDate(s.eta)}, keyakinan ${s.etaConfidence}` : '–'],
          ]}
        />
      </div>
      {(t.firstMismatch || t.underInvestigation) && (
        <div className="flex flex-wrap gap-2">
          {t.firstMismatch && <Chip tone="er" icon="x">Tidak cocok</Chip>}
          {t.underInvestigation && <Chip tone="wn" icon="clock">Sedang diselidiki</Chip>}
        </div>
      )}
    </section>
  )
}

export function MismatchBanner({ t, withLink = true }: { t: Tracking; withLink?: boolean }) {
  if (!t.firstMismatch) return null
  return (
    <Banner tone="er" icon="alert" role="alert">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          Kami menemukan ketidakcocokan identitas paket di {t.firstMismatch.hub}. Investigasi dibuka otomatis.
        </p>
        {withLink && <Link className="lnk self-start" href={`/lacak/${t.shipment.awb}/rute`}>Lihat titik pertama ketidakcocokan</Link>}
      </div>
    </Banner>
  )
}

function EventBody({ e, awb }: { e: ShipmentEvent; awb: string }) {
  const when = fmtDateTime(e.occurredAt)
  if (e.kind === 'no_scan') {
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-wn">{e.title}</span>
        <span className="num text-[13px] text-mut">
          {fmtShort(e.occurredAt)} sampai {e.gapUntil ? fmtShort(e.gapUntil) : 'sekarang'} · {e.note || e.location}
        </span>
      </div>
    )
  }
  if (e.kind === 'hub_scan' && e.isFirstMismatch) {
    return (
      <div className="flex flex-col gap-1.5 rounded-r border-l-2 border-er bg-er-bg/70 px-4 py-3">
        <Chip tone="er" icon="flag" className="self-start bg-white">Ketidakcocokan pertama</Chip>
        <span className="font-semibold">{e.title}</span>
        <span className="num text-[13px] text-mut">{when} · {e.method} {e.actor?.replace('Petugas ', '')}</span>
        <p>
          {e.note || 'Identitas paket berbeda dari catatan pengambilan.'}{' '}
          <Link className="lnk" href={`/lacak/${awb}/rute`}>Lihat perbandingan</Link>
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col">
      <span className="font-semibold">{e.title}</span>
      <span className="num text-[13px] text-mut">{when}{e.location && e.kind !== 'hub_scan' ? ` · ${e.location}` : ''}{e.kind === 'hub_scan' && e.actor ? ` · ${e.method} ${e.actor.replace('Petugas ', '')}` : ''}</span>
      {e.kind === 'hub_scan' && e.identityResult === 'match' && <span className="text-[13px] font-medium text-ok">Identitas paket cocok</span>}
      {e.kind === 'hub_scan' && e.identityResult === 'mismatch' && <span className="text-[13px] font-medium text-er">Identitas paket tidak cocok dengan catatan pengambilan</span>}
      {e.kind !== 'hub_scan' && (e.actor || e.method) && (
        <span className="text-[13px] text-mut">{[e.kind === 'delivered' && e.actor === 'Penerima' ? 'Penerima' : e.actor, e.method].filter(Boolean).join(' · ')}</span>
      )}
    </div>
  )
}

export function eventVisual(e: ShipmentEvent): { tone: 'ok' | 'er' | 'wn' | 'nu' | 'nb'; icon: 'check' | 'x' | 'clock' | 'pin' | 'alert' } {
  if (e.kind === 'no_scan') return { tone: 'wn', icon: 'clock' }
  if (e.kind === 'hub_scan') return e.identityResult === 'mismatch' ? { tone: 'er', icon: e.isFirstMismatch ? 'alert' : 'x' } : { tone: 'ok', icon: 'check' }
  if (e.kind === 'out_for_delivery') return { tone: 'nu', icon: 'pin' }
  if (e.kind === 'delivered') return e.method?.includes('tanpa bukti') ? { tone: 'wn', icon: 'alert' } : { tone: 'ok', icon: 'check' }
  return { tone: 'ok', icon: 'check' }
}

export function Timeline({ t, recipientLabel }: { t: Tracking; recipientLabel: string }) {
  return (
    <ol className="m-0 list-none p-0">
      {t.events.map((e, i) => {
        const v = eventVisual(e)
        const ev = e.kind === 'delivered' && e.actor === 'Penerima' ? { ...e, actor: `Penerima ${recipientLabel}` } : e
        return (
          <TimelineItem key={e.id} tone={v.tone} icon={v.icon} dashed={e.kind === 'no_scan'} last={i === t.events.length - 1}>
            <EventBody e={ev} awb={t.shipment.awb} />
          </TimelineItem>
        )
      })}
    </ol>
  )
}

/** Peta skematis rute: node per pemeriksaan, garis aktual vs rencana. */
export function RouteSchematic({ checks }: { checks: IdentityCheck[] }) {
  const nodes = checks.filter((c) => c.result !== 'reference')
  if (!nodes.length) return <p className="hint">Belum ada data rute.</p>
  const W = 340
  const H = 200
  const pts = nodes.map((n, i) => ({
    n,
    x: 40 + (i * (W - 80)) / Math.max(1, nodes.length - 1),
    y: 50 + (i % 2 === 0 ? 0 : 50) + i * 18,
  }))
  const firstBad = pts.findIndex((p) => p.n.result === 'mismatch')
  const color = (r: string) => (r === 'match' ? '#14305B' : r === 'mismatch' ? '#B3261E' : '#fff')
  const path = (arr: typeof pts) => arr.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="h-auto w-full" role="img" aria-label="Peta skematis rute paket">
      <path d={path(pts)} fill="none" stroke="#8795AD" strokeWidth="1" strokeDasharray="4 4" />
      {firstBad > 0 && <path d={path(pts.slice(0, firstBad + 1))} fill="none" stroke="#14305B" strokeWidth="2" />}
      {firstBad >= 0 && <path d={path(pts.slice(firstBad).filter((p) => p.n.result !== 'not_scanned'))} fill="none" stroke="#B3261E" strokeWidth="2" />}
      {firstBad < 0 && <path d={path(pts.filter((p) => p.n.result !== 'not_scanned'))} fill="none" stroke="#14305B" strokeWidth="2" />}
      {pts.map((p, i) => (
        <g key={p.n.id}>
          <circle
            cx={p.x}
            cy={p.y}
            r={i === firstBad ? 8 : 6}
            fill={color(p.n.result)}
            stroke={p.n.result === 'not_scanned' ? '#434F63' : '#fff'}
            strokeWidth="2"
            strokeDasharray={p.n.result === 'not_scanned' ? '3 2' : undefined}
          />
          <text
            x={p.x}
            y={p.y + (i % 2 === 0 ? -18 : 26)}
            fontSize="11"
            fontWeight={p.n.result === 'not_scanned' ? 400 : 600}
            fill={i === firstBad ? '#B3261E' : p.n.result === 'not_scanned' ? '#434F63' : '#16202E'}
            textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}
          >
            {p.n.hub.replace(/^Hub (Transit |Asal )?/, '')}
            {i === firstBad ? ' · titik pertama' : p.n.result === 'not_scanned' ? ' · tidak dipindai' : ''}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function IdentityCard({ c, reference }: { c: IdentityCheck; reference: IdentityCheck | null }) {
  if (c.result === 'not_scanned') {
    return (
      <Card className="flex flex-col gap-2 border-dashed bg-transparent">
        <div className="flex items-center justify-between gap-2"><span className="font-semibold">{c.hub}</span><Chip tone="nu" icon="clock">Tidak dipindai</Chip></div>
        <p className="text-[13px] text-mut">{c.note}</p>
      </Card>
    )
  }
  const isRef = c.result === 'reference'
  const bad = c.result === 'mismatch'
  const wDiff = bad && !!reference && Math.abs((c.weightKg ?? 0) - (reference.weightKg ?? 0)) > (reference.weightKg ?? 0) * 0.02 + 0.005
  const dDiff = bad && !!reference && dims(c.lengthCm, c.widthCm, c.heightCm) !== dims(reference.lengthCm, reference.widthCm, reference.heightCm)
  const sDiff = bad && !!reference && c.sealNo !== reference.sealNo
  return (
    <Card className={`flex flex-col gap-4 ${c.isFirstMismatch ? 'border-er/50 shadow-[inset_2px_0_0_var(--color-er)]' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{isRef ? 'Catatan pengambilan (acuan)' : c.hub}</span>
        {isRef ? (
          <Chip tone="nu" icon="pin">{c.checkedAt ? fmtShort(c.checkedAt) : '–'}</Chip>
        ) : bad ? (
          <Chip tone="er" icon="x">Tidak cocok</Chip>
        ) : (
          <Chip tone="ok" icon="check">Cocok</Chip>
        )}
      </div>
      {c.isFirstMismatch && <Chip tone="er" icon="flag" className="self-start">Ketidakcocokan pertama</Chip>}
      <KV
        rows={[
          ['Berat', <span key="w" className={wDiff ? 'diff' : ''}>{kg(c.weightKg)}</span>],
          ['Ukuran', <span key="d" className={dDiff ? 'diff' : ''}>{dims(c.lengthCm, c.widthCm, c.heightCm)}</span>],
          ['Nomor segel', <span key="s" className={`font-mono ${sDiff ? 'diff' : ''}`}>{c.sealNo ?? '–'}</span>],
        ]}
      />
      {c.note && bad && <p className="text-[13px] text-mut">{c.note}</p>}
    </Card>
  )
}

export function MiniFact({ icon, children }: { icon: 'info' | 'lock'; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[13px] text-mut">
      <Icon name={icon} size={16} className="mt-px" />
      <span>{children}</span>
    </p>
  )
}
