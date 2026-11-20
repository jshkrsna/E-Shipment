import { TrackForm } from '@/components/track-form'
import { EmptyState } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="wx flex max-w-[640px] flex-col gap-6 py-12">
      <EmptyState icon="search" title="Nomor resi tidak ditemukan">Periksa kembali nomor resi pada struk atau label paket, lalu coba lagi.</EmptyState>
      <TrackForm />
    </div>
  )
}
