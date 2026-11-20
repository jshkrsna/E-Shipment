import { Icon } from '@/components/icon'

export default function LaporanIndex() {
  return (
    <div className="hidden h-full items-center justify-center p-10 text-center text-mut lg:flex">
      <div className="flex flex-col items-center gap-2">
        <span className="grid size-12 place-items-center rounded-full bg-nu-bg text-nu"><Icon name="chat" size={24} /></span>
        <p className="font-semibold text-txt">Pilih laporan di sebelah kiri</p>
        <p className="max-w-xs text-[13px]">Detail, validasi, investigasi, dan percakapan dengan pelapor tampil di sini.</p>
      </div>
    </div>
  )
}
