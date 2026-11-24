import { Banner, Card, Chip, EmptyState, EvidencePhoto, KV, Stamp } from '@/components/ui'
import { Icon } from '@/components/icon'
import { getSharedView } from '@/server/services/cases'
import { dims, fmtDateTime, fmtShort, fmtStamp, kg, maskName, maskPhone } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Bukti pengiriman (hanya baca)', robots: { index: false } }

export default async function BuktiBersama({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const v = await getSharedView(token)
  if (v.state !== 'ok') {
    const msg = { invalid: 'Tautan tidak valid.', revoked: 'Tautan sudah dicabut oleh pemilik.', expired: 'Tautan sudah kedaluwarsa.' }[v.state]
    return <div className="wx max-w-[560px] py-12"><EmptyState icon="lock" title={msg}>Minta tautan baru kepada pemilik kasus.</EmptyState></div>
  }
  const { bundle: b, checks, courier, link } = v
  const ref = checks.find((c) => c.result === 'reference')
  const first = checks.find((c) => c.isFirstMismatch)
  const pickup = courier.find((e) => e.kind === 'pickup')
  const scan = courier.find((e) => e.kind === 'hub_scan')
  const userFiles = b.evidence.filter((e) => e.ownerType === 'user')
  const pm = pickup?.meta ? (JSON.parse(pickup.meta) as Record<string, string>) : {}

  return (
    <Reveal>
      <WireMemo shape={{ cards: 2 + (pickup ? 1 : 0) + (first && ref ? 1 : 0), files: userFiles.length }} />
      <div className="wx flex max-w-[960px] flex-col gap-4 py-6 lg:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-navy">Bukti pengiriman, dibagikan pemilik kasus</span>
            <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-navy-d md:text-[32px]">Paket <span className="font-mono">{b.shipment.awb}</span></h1>
            <span className="text-mut">{b.shipment.courier} (sesuai laporan), kasus <span className="font-mono">{b.case.code}</span></span>
          </div>
          <Chip tone="nu" icon="lock">Hanya baca</Chip>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Banner tone="wn" icon="clock"><div className="flex flex-col gap-0.5"><span className="font-semibold">Berlaku sampai {fmtDateTime(link.expiresAt)}</span><span className="text-[13px]">Tautan ini dapat dicabut pemilik kapan saja.</span></div></Banner>
          <Banner tone="nb" icon="info"><p>Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.</p></Banner>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <span className="font-semibold">Ringkasan</span>
            <KV rows={[['Penerima', maskName(b.shipment.recipientName)], ['Alamat', '••••••••••'], ['Telepon', maskPhone()], ['Status', `${b.shipment.status} · ${b.shipment.statusSource ?? ''}${b.shipment.statusAt ? ` · ${fmtShort(b.shipment.statusAt)}` : ''}`]]} />
            <p className="text-[13px] text-mut">Nama, alamat, dan telepon disamarkan pada tampilan bersama.</p>
          </Card>

          {pickup && (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">Bukti pengambilan</span><Chip tone="nb">Dicatat kurir</Chip></div>
              <EvidencePhoto src={pickup.storageKey ? `/api/evidence/${pickup.id}/file?share=${token}` : null} alt="Foto paket saat diambil kurir" className="h-28" />
              <KV rows={[['Berat', pm.berat ?? kg(ref?.weightKg)], ['Segel', <span key="s" className="font-mono">{pm.segel ?? ref?.sealNo}</span>]]} />
              <Stamp>Cap integritas {fmtStamp(pickup.createdAt)}</Stamp>
            </Card>
          )}

          {first && ref && (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">Hasil pemeriksaan di {first.hub.replace('Transit ', '')}</span><Chip tone="er" icon="x">Tidak cocok</Chip></div>
              <KV
                rows={[
                  ['Berat', `${kg(ref.weightKg)} → ${kg(first.weightKg)}`],
                  ['Ukuran', `${dims(ref.lengthCm, ref.widthCm, ref.heightCm)} → ${dims(first.lengthCm, first.widthCm, first.heightCm)}`],
                  ['Segel', <span key="s" className="font-mono">{ref.sealNo} → {first.sealNo}</span>],
                ]}
              />
              {(scan || first.checkedAt) && <Stamp>Cap integritas {fmtStamp(scan?.createdAt ?? first.checkedAt!)}</Stamp>}
            </Card>
          )}

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2"><span className="font-semibold">Foto unboxing</span><Chip tone="nu">Ditambahkan penerima</Chip></div>
            {userFiles.length === 0 ? (
              <p className="text-mut">Tidak ada berkas dari penerima.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {userFiles.map((e) =>
                  e.storageKey ? (
                    e.mediaType === 'video' ? (
                      <video key={e.id} src={`/api/evidence/${e.id}/file?share=${token}`} controls preload="metadata" className="aspect-video w-full rounded-r bg-black" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={e.id} src={`/api/evidence/${e.id}/file?share=${token}`} alt={e.fileName} className="aspect-[4/3] w-full rounded-r object-cover" />
                    )
                  ) : (
                    <EvidencePhoto key={e.id} alt={e.fileName} emptyText={`${e.fileName} · berkas tidak tersedia`} className="h-20" />
                  ),
                )}
              </div>
            )}
            {userFiles[0] && <Stamp>Diunggah {fmtDateTime(userFiles[0].createdAt)}. Tidak dapat diubah.</Stamp>}
          </Card>
        </div>

        <section className="card flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-semibold"><Icon name="shield" size={18} className="text-ok" />Cara memverifikasi</h2>
          <p className="text-[13px] text-mut">Cap integritas mencatat waktu unggah dan sidik jari SHA-256 berkas. Bila berkas diubah, sidik jarinya tidak lagi cocok.</p>
          <ul className="flex flex-col gap-1 font-mono text-[11px] break-all text-mut">
            {[...courier.filter((e) => e.kind !== 'hub_scan' || first), ...userFiles].filter((e) => e.sha256).map((e) => (
              <li key={e.id}><span className="font-sans font-semibold text-txt">{e.ownerType === 'courier' ? e.fileName : e.fileName}:</span> {e.sha256}</li>
            ))}
          </ul>
        </section>
      </div>
    </Reveal>
  )
}
