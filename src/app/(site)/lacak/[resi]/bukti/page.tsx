import { notFound } from 'next/navigation'
import { Brankas, type VaultFile } from '@/components/brankas'
import { ClaimForm } from '@/components/claim-form'
import { Banner, Card, Chip, KV, LinkButton, Placeholder, Stamp } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'
import { fmtDateTime, fmtStamp } from '@/lib/format'

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
  const files: VaultFile[] = t.userEvidence.map((e) => ({
    id: e.id, fileName: e.fileName, mediaType: e.mediaType, source: e.source, size: e.size, durationSec: e.durationSec,
    locked: !!e.lockedAt, hasFile: !!e.storageKey, createdAt: e.createdAt.toISOString(),
  }))

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold">Bukti pengambilan</span><Chip tone="nb" icon="lock">Dicatat kurir</Chip></div>
          {pickup ? (
            <>
              <Placeholder className="h-36">Foto paket saat diambil<br />(placeholder)</Placeholder>
              <KV
                rows={[
                  ['Berat', pm.berat ?? '–'],
                  ['Ukuran', pm.ukuran ?? '–'],
                  ['Nomor segel', <span key="s" className="font-mono">{pm.segel ?? '–'}</span>],
                  ['Waktu', fmtDateTime(pickup.createdAt)],
                  ['Lokasi', pm.lokasi ?? '–'],
                ]}
              />
              <Stamp>Cap integritas {fmtStamp(pickup.createdAt)} · tidak dapat diubah setelah diunggah</Stamp>
            </>
          ) : (
            <p className="text-mut">Bukti pengambilan belum tersedia.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold">Bukti serah terima</span><Chip tone="nb" icon="lock">Dicatat kurir</Chip></div>
          {handover ? (
            <>
              <div className="flex gap-3">
                <Placeholder className="size-24 shrink-0">Foto serah terima</Placeholder>
                <div className="flex min-w-0 flex-col gap-1">
                  <Chip tone="ok" icon="check" className="self-start">{hm.metode ?? 'Konfirmasi OTP'}</Chip>
                  <span className="font-semibold">Diterima {fmtDateTime(handover.createdAt)}</span>
                  <span className="text-[12px] text-mut">Penerima {t.shipment.recipientMasked} · {hm.lokasi ?? t.shipment.destination}</span>
                </div>
              </div>
              <Stamp>Cap integritas {fmtStamp(handover.createdAt)} · tidak dapat diubah setelah diunggah</Stamp>
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
          <div className="flex items-center justify-between gap-2"><h2 className="text-[16px] font-bold">Brankas unboxing</h2><Chip tone="nu">Khusus penerima</Chip></div>
          <Card className="flex flex-col gap-3">
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
          </Card>
        </section>
      )}

      <Banner tone="nb" icon="info">
        <p className="text-[12px]">Berkas yang Anda tambahkan ditandai terpisah dari catatan kurir, dan akan terisi otomatis saat Anda melaporkan masalah.</p>
      </Banner>
      <p className="note">Foto kurir pada data contoh berupa placeholder. Waktu dan nilai adalah data ilustrasi.</p>
    </>
  )
}
