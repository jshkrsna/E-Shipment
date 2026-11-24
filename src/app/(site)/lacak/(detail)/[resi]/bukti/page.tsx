import { notFound } from 'next/navigation'
import { Brankas, type VaultFile } from '@/components/brankas'
import { ClaimForm } from '@/components/claim-form'
import { Banner, Card, Chip, EvidencePhoto, KV, LinkButton, Stamp } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'
import { fmtDateTime, fmtStamp, linkProviderFromMeta } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export default async function BuktiPage({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const awb = decodeURIComponent(resi).toUpperCase()
  const user = await getCurrentUser()
  const t = await getTrackingCached(awb, user)
  if (!t) notFound()
  const pickup = t.courierEvidence.find((e) => e.kind === 'pickup')
  const handover = t.courierEvidence.find((e) => e.kind === 'handover')
  const pm = pickup?.meta ? (JSON.parse(pickup.meta) as Record<string, string>) : {}
  const hm = handover?.meta ? (JSON.parse(handover.meta) as Record<string, string>) : {}
  // Berkas bukti (termasuk foto kurir) hanya boleh dibuka pemilik paket dan admin.
  const canSeeFiles = t.isOwner || t.isAdmin
  const photo = (e?: { id: number; storageKey: string | null }) => (e?.storageKey && canSeeFiles ? `/api/evidence/${e.id}/file` : null)
  const photoEmpty = (e?: { storageKey: string | null }) => (e?.storageKey ? 'Foto hanya untuk penerima paket' : 'Foto belum dilampirkan kurir')
  const files: VaultFile[] = t.userEvidence.map((e) => ({
    id: e.id, fileName: e.fileName, mediaType: e.mediaType, source: e.source, size: e.size, durationSec: e.durationSec,
    locked: !!e.lockedAt, hasFile: !!e.storageKey, createdAt: e.createdAt.toISOString(),
    url: e.mediaType === 'link' ? e.url : null, provider: e.mediaType === 'link' ? linkProviderFromMeta(e.meta) : null,
  }))

  return (
    <Reveal>
      <WireMemo scope={`/lacak/${t.shipment.awb}/bukti`} shape={{ owner: t.isOwner || t.isAdmin ? 1 : 0, files: files.length, canEdit: t.isOwner && user?.role === 'PENGGUNA' ? 1 : 0 }} />
      <>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2"><h2 className="text-[15px] font-semibold">Bukti pengambilan</h2><Chip tone="nb" icon="lock">Dicatat kurir</Chip></div>
            {pickup ? (
              <>
                <EvidencePhoto src={photo(pickup)} alt="Foto paket saat diambil kurir" emptyText={photoEmpty(pickup)} className="h-36" />
                <KV
                  rows={[
                    ['Berat', pm.berat ?? '–'],
                    ['Ukuran', pm.ukuran ?? '–'],
                    ['Nomor segel', <span key="s" className="font-mono">{pm.segel ?? '–'}</span>],
                    ['Waktu', fmtDateTime(pickup.createdAt)],
                    ['Lokasi', pm.lokasi ?? '–'],
                  ]}
                />
                <Stamp>Cap integritas {fmtStamp(pickup.createdAt)}. Tidak dapat diubah setelah diunggah.</Stamp>
              </>
            ) : (
              <p className="text-mut">Bukti pengambilan belum tersedia.</p>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2"><h2 className="text-[15px] font-semibold">Bukti serah terima</h2><Chip tone="nb" icon="lock">Dicatat kurir</Chip></div>
            {handover ? (
              <>
                <div className="flex gap-3">
                  <EvidencePhoto src={photo(handover)} alt="Foto serah terima paket" emptyText={photoEmpty(handover)} className="size-24 shrink-0" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <Chip tone="ok" icon="check" className="self-start">{hm.metode ?? 'Konfirmasi OTP'}</Chip>
                    <span className="font-semibold">Diterima {fmtDateTime(handover.createdAt)}</span>
                    <span className="text-[13px] text-mut">Penerima {t.shipment.recipientMasked}, {hm.lokasi ?? t.shipment.destination}</span>
                  </div>
                </div>
                <Stamp>Cap integritas {fmtStamp(handover.createdAt)}. Tidak dapat diubah setelah diunggah.</Stamp>
              </>
            ) : (
              <Banner tone="wn" icon="alert"><p className="text-[13px]">{t.shipment.status === 'Diterima' ? 'Status “diterima” tanpa bukti serah terima. Anomali ini sudah masuk antrean pemeriksaan.' : 'Paket belum diserahkan.'}</p></Banner>
            )}
          </Card>
        </div>

        {t.isOwner ? (
          <Brankas awb={awb} files={files} canEdit={user?.role === 'PENGGUNA'} />
        ) : t.isAdmin ? (
          <Brankas awb={awb} files={files} canEdit={false} />
        ) : (
          <section className="flex flex-col gap-3" aria-label="Brankas unboxing">
            <div className="flex items-center justify-between gap-2"><h2 className="text-[17px] font-semibold">Brankas unboxing</h2><Chip tone="nu">Khusus penerima</Chip></div>
            <div className="flex flex-col gap-4 rounded-p border border-dashed border-line-d p-5">
              <p className="text-mut">
                Penerima dapat menyimpan foto dan video unboxing di sini sebagai bukti. {t.userEvidenceCount > 0 && `Paket ini memiliki ${t.userEvidenceCount} berkas dari penerima.`}
              </p>
              {!user ? (
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/masuk?next=/lacak/${awb}/bukti`} icon="user">Masuk untuk menambah bukti</LinkButton>
                  <LinkButton href={`/daftar?next=/lacak/${awb}/bukti`} variant="secondary">Daftar</LinkButton>
                </div>
              ) : t.shipment.claimed ? (
                <Banner tone="nu" icon="lock"><p className="text-[13px]">Paket ini sudah diklaim oleh akun penerima lain.</p></Banner>
              ) : (
                <ClaimForm awb={awb} />
              )}
            </div>
          </section>
        )}

        <p className="note">Berkas yang Anda tambahkan ditandai terpisah dari catatan kurir, dan akan terisi otomatis saat Anda melaporkan masalah.</p>
      </>
    </Reveal>
  )
}
