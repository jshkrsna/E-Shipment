import { AdminCaseList, type ListItem } from '@/components/admin/case-tools'
import { Chip } from '@/components/ui'
import { listCases } from '@/server/services/admin'
import { categoryLabel } from '@/lib/labels'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Laporan masuk' }

export default async function LaporanLayout({ children }: { children: React.ReactNode }) {
  const { items, counts } = await listCases()
  const list: ListItem[] = items.map((i) => ({
    code: i.code, statusLabel: i.statusLabel, tone: i.tone, category: categoryLabel(i.category, i.categoryOther), categoryKey: i.category,
    reporter: i.reporter, createdAt: i.createdAt.toISOString(), escalated: i.escalated, priority: i.priority,
  }))
  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col lg:min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-4 md:px-6">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-semibold md:text-[22px]">Laporan masuk</h1>
          <span className="text-[13px] text-mut">Laporan dari aplikasi penerima. Setiap tindakan tercatat di jejak audit.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="wn">Baru {counts.baru}</Chip>
          <Chip tone="nb">Diproses {counts.diproses}</Chip>
          <Chip tone="ok">Selesai {counts.selesai}</Chip>
        </div>
      </div>
      <WireMemo scope="/admin/laporan" shape={{ items: list.length }} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <AdminCaseList items={list} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
