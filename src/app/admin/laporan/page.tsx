import { Icon } from '@/components/icon'
import { Reveal } from '@/components/reveal'

export default function LaporanIndex() {
  return (
    <Reveal>
      <div className="hidden h-full items-center justify-center p-10 text-center text-mut lg:flex">
        <div className="flex flex-col items-center gap-2">
          <span className="text-navy/60"><Icon name="chat" size={26} strokeWidth={1.5} /></span>
          <p className="font-medium text-txt">Pilih laporan di sebelah kiri</p>
          <p className="max-w-xs text-[13px]">Detail, validasi, investigasi, dan percakapan dengan pelapor tampil di sini.</p>
        </div>
      </div>
    </Reveal>
  )
}
