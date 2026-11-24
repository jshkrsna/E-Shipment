'use client'

import { cx } from '../ui'
import { pick, useShape, useWireRoute } from './memo'
import { AkunWire } from './site'
import { WBox, WBtn, WChat, WField, WFilter, WLine, WNode, WPara, WPill, WRule, WText, WTimeline, Wire, at } from './primitives'

/*
 * Wireframe panel admin: mengikuti tata letak setiap halaman admin, filter/tab aktif dari URL,
 * dan jumlah baris dari bentuk konten terakhir (WireMemo).
 */

const PAD = 'flex flex-col gap-8 px-4 py-6 md:px-8 lg:px-10 lg:py-10'
const AH1 = 'text-[24px] leading-tight font-semibold md:text-[28px]'
const H3 = 'text-[17px] font-semibold'

function L({ i, w, h = 22.4, className }: { i?: number; w: string | number; h?: number; className?: string }) {
  return (
    <span className={cx('flex items-center', className)} style={{ height: h }}>
      <WLine i={i} w={w} />
    </span>
  )
}
const Hair = ({ i, top }: { i?: number; top?: boolean }) => <WRule i={i} className={cx('absolute inset-x-0', top ? 'top-0' : 'bottom-0')} />
/** Pemisah sel statis (garis putus tipis) untuk kisi KPI/tabel. */
const CELL = 'border-dashed border-navy/15'

function Header({ title, lines = [2, 1] as [number, number], i = 0 }: { title: string; lines?: [number, number]; i?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <WText as="h1" i={i} className={AH1}>{title}</WText>
      <WPara i={i + 1} lines={lines} lh={24} last="52%" className="max-w-[720px]" />
    </div>
  )
}

/** Tabel bergaris: kepala nyata + baris garis. */
function Table({ i, cols, heads, rows, pillCol, className }: { i: number; cols: string; heads: string[]; rows: number; pillCol?: number; className?: string }) {
  return (
    <div className={className}>
      <div className="relative grid items-center gap-4 px-4 py-3" style={{ gridTemplateColumns: cols }}>
        {heads.map((h, k) => <WText key={k} i={i + k} className="truncate text-[13px] font-medium">{h}</WText>)}
        <Hair i={i} />
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="relative grid min-h-[58px] items-center gap-4 px-4 py-3" style={{ gridTemplateColumns: cols }}>
          {heads.map((_, k) => (k === pillCol ? <WPill key={k} i={i + r + 1} w={78} /> : <L key={k} i={i + r + 1} w={`${78 - ((r + k) % 4) * 12}%`} />))}
          {r < rows - 1 && <Hair i={i + r + 1} />}
        </div>
      ))}
    </div>
  )
}

/* ── Dasbor ──────────────────────────────────────────── */

const KPIS = ['Paket aktif', 'Berisiko', 'Macet', 'Tidak cocok', 'Kasus mendekati batas']
const DASH_FILTERS = [
  { key: 'semua', label: 'Semua' },
  { key: 'mismatch', label: 'Tidak cocok' },
  { key: 'stuck', label: 'Macet' },
  { key: 'no_proof', label: 'Diterima tanpa bukti' },
]

function QueueRows({ q }: { q: number }) {
  return (
    <>
    <Table
      i={6}
      className="hidden md:block"
      cols="80px 150px 1.2fr 1fr 100px 1fr 90px 90px"
      heads={['Tingkat', 'Resi', 'Jenis', 'Hub', 'Terdeteksi', 'Penugasan', 'Batas waktu', '']}
      rows={q}
      pillCol={0}
    />
    <div className="relative flex flex-col md:hidden">
      <Hair i={6} top />
      {Array.from({ length: q }, (_, r) => (
        <div key={r} className="relative flex flex-col gap-2 px-5 py-4">
          <div className="flex items-center justify-between gap-2"><WPill i={6 + r} w={70} /><WPill i={7 + r} w={86} /></div>
          <L i={7 + r} w="150px" h={24} />
          <L i={7 + r} w="68%" />
          <L i={8 + r} w="80%" h={19.5} />
          <WBtn i={8 + r} sm w={150} />
          <Hair i={8 + r} />
        </div>
      ))}
    </div>
    </>
  )
}

/** Wireframe antrean saat filter dasbor (?f=) berganti. */
export function AdminQueueWire() {
  const s = useShape()
  return (
    <Wire className="flex flex-col gap-4" label="Memuat antrean…">
      <QueueRows q={pick(s, 'queue', 4, 12)} />
    </Wire>
  )
}

export function AdminDashWire() {
  const { params } = useWireRoute()
  const f = DASH_FILTERS.find((x) => x.key === params.get('f'))?.key ?? 'semua'
  const s = useShape()
  const counts = useShape('/admin')
  const q = pick(s, 'queue', 4, 12)
  return (
    <Wire className={PAD}>
      <Header title="Dasbor dan antrean anomali" />
      <WBox i={2} className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-5">
        {KPIS.map((k, n) => (
          <div key={k} className={cx('-mt-px -ml-px flex flex-col gap-1.5 border-t border-l p-5', CELL)}>
            <WText i={3 + n} className="text-[13px] font-medium">{k}</WText>
            <WBox i={3 + n} r={4} className="h-[30px] w-12 md:h-[34px]" />
            <WPara i={4 + n} lines={[2, 1]} lh={19.5} last="70%" />
          </div>
        ))}
      </WBox>
      <WBox i={4} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <WText as="h2" i={5} className={H3}>Antrean anomali</WText>
          <div className="flex flex-wrap gap-2">
            {DASH_FILTERS.map((x, n) => {
              const c = pick(counts, `c_${x.key}`, -1, 999)
              return <WFilter key={x.key} i={5 + n} on={x.key === f}>{c >= 0 ? `${x.label} (${c})` : x.label}</WFilter>
            })}
          </div>
        </div>
        <QueueRows q={q} />
        <L i={9} w="330px" h={19.5} className="mx-5 mb-5 max-w-full pl-3" />
      </WBox>
    </Wire>
  )
}

/* ── Laporan masuk (daftar + detail) ─────────────────── */

const LIST_FILTERS = ['Semua', 'Baru', 'Diproses', 'Selesai']
const TABS = [
  { key: 'laporan', label: 'Laporan & validasi' },
  { key: 'investigasi', label: 'Investigasi' },
  { key: 'audit', label: 'Jejak audit' },
] as const

type CaseTab = (typeof TABS)[number]['key']

/** Isi tab kasus admin (dipakai juga saat berpindah tab: hanya bagian ini yang diganti). */
function CaseTabs({ tab, code }: { tab: CaseTab; code: string }) {
  const base = useShape(`/admin/laporan/${code}`)
  const t = useShape()
  const baru = pick(base, 'baru', 0, 1)
  const evidence = pick(base, 'evidence', 3, 10)
  return (
    <>
      {tab === 'laporan' && (
        <>
          <WBox i={4} className="flex flex-col gap-3 p-5">
            <WText as="h3" i={4} className={H3}>Laporan dari penerima</WText>
            <div className="relative pl-4">
              <span aria-hidden className="wire-vbar absolute inset-y-0 left-0" style={at(4)} />
              <WPara i={5} lines={[3, 2]} lh={24} last="40%" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1"><L i={5} w="110px" /><L i={5} w="120px" /><L i={6} w="130px" /><L i={6} w="140px" /></div>
            <div className="relative flex flex-col gap-2 pt-4">
              <Hair i={6} top />
              {Array.from({ length: evidence }, (_, k) => (
                <div key={k} className="flex items-center justify-between gap-2"><L i={6 + k} w={`${44 - (k % 3) * 6}%`} /><WPill i={7 + k} w={k ? 92 : 104} /></div>
              ))}
            </div>
          </WBox>
          <WBox i={6} className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1"><WText as="h2" i={6} className="text-[18px] font-semibold">Validasi laporan</WText><L i={7} w="72%" h={19.5} /></div>
            {baru > 0 && <WBox i={7} r={6} className="h-[46px]" />}
            {[0, 1].map((k) => (
              <WBox key={k} i={8 + k} className="flex min-h-20 items-center justify-between gap-3 px-4 py-4">
                <L i={8 + k} w="44%" h={24} className="flex-1" />
                <WBox i={9 + k} r={6} className="h-12 w-[134px] shrink-0" />
              </WBox>
            ))}
            <div className="flex flex-col gap-1"><L i={10} w="150px" h={22.5} /><L i={10} w="44%" h={24} /></div>
            <div className="flex flex-wrap gap-2"><WBtn i={11} w={244} /><WBtn i={11} w={130} /></div>
          </WBox>
        </>
      )}

      {tab === 'investigasi' && (
        <div className="grid gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <WBox i={4} className="flex flex-col gap-3 p-5">
            <WText as="h3" i={4} className={H3}>Linimasa dengan anomali</WText>
            <WTimeline from={5} n={pick(t, 'events', 6, 12)} bad={pick(t, 'bad', -1, 12)} gap={pick(t, 'gap', -1, 12)} compact />
          </WBox>
          <div className="flex min-w-0 flex-col gap-4">
            <WBox i={5} className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <WText as="h3" i={5} className={H3}>Diharapkan vs dipindai</WText>
                <div className="flex flex-wrap gap-2">{Array.from({ length: pick(t, 'hubs', 3, 6) }, (_, k) => <WPill key={k} i={6 + k} w={96} className="!h-9" />)}</div>
              </div>
              <Table i={6} cols="1fr 1.3fr 1.3fr 80px" heads={['Atribut', 'Diharapkan (pengambilan)', 'Dipindai', 'Hasil']} rows={3} pillCol={3} />
              <WBox i={8} r={6} tone="er" className="h-[72px] md:h-[48px]" />
              <L i={9} w="200px" h={19.5} />
            </WBox>
            <div className="grid gap-4 md:grid-cols-2">
              <WBox i={9} className="flex flex-col gap-3 p-5">
                <L i={9} w="40%" h={27} />
                <WField i={10} label="30%" />
                <WField i={10} label="40%" />
                <WField i={11} label="36%" h={68} />
                <WBtn i={11} w={150} />
              </WBox>
              <WBox i={10} className="flex flex-col gap-3 p-5">
                <WText as="h3" i={10} className={H3}>Catatan internal</WText>
                <WBox i={10} r={6} className="h-[68px]" />
                <WBtn i={11} w={140} />
                {Array.from({ length: pick(t, 'notes', 1, 5) }, (_, k) => (
                  <div key={k} className="relative flex flex-col gap-1 py-1 pl-3">
                    <span aria-hidden className="wire-vbar absolute inset-y-0 left-0" style={at(11 + k)} />
                    <L i={11 + k} w="84%" />
                    <L i={12 + k} w="50%" h={19.5} />
                  </div>
                ))}
              </WBox>
            </div>
            <WBox i={11} className="flex flex-col gap-3 p-5">
              <L i={11} w="36%" h={27} />
              <WBox i={12} r={6} className="h-[92px]" />
              <WBtn i={12} w={170} />
            </WBox>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <WBox i={4} className="flex flex-col">
          <Table i={4} cols="160px 1fr 140px" heads={['Waktu', 'Kejadian', 'Pelaku']} rows={pick(t, 'audit', 5, 12)} />
          <L i={8} w="62%" h={19.5} className="m-4 pl-3" />
        </WBox>
      )}
    </>
  )
}

/** Wireframe saat berpindah tab (?tab=) di halaman kasus admin. */
export function AdminCaseTabWire() {
  const { pathname, params } = useWireRoute()
  const code = decodeURIComponent(pathname.split('/')[3] ?? '').toUpperCase()
  const tab = TABS.find((x) => x.key === params.get('tab'))?.key ?? 'laporan'
  return (
    <Wire className="flex flex-col gap-5" label="Memuat tab…">
      <CaseTabs tab={tab} code={code} />
    </Wire>
  )
}

function CaseBody() {
  const { pathname, params } = useWireRoute()
  const code = decodeURIComponent(pathname.split('/')[3] ?? '').toUpperCase()
  const tab = TABS.find((t) => t.key === params.get('tab'))?.key ?? 'laporan'
  const base = useShape(`/admin/laporan/${code}`)
  const baru = pick(base, 'baru', 0, 1)
  const messages = pick(base, 'messages', 2, 4)

  return (
    <div className="flex flex-col xl:h-full xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6 lg:p-8">
        <L i={0} w="110px" h={19.5} className="lg:hidden" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <WText as="h2" i={0} className="font-mono text-[22px] leading-tight font-medium md:text-[26px]">{code}</WText>
              <WBox i={1} r={6} className="h-7 w-36 md:h-8" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1"><L i={1} w="140px" /><L i={2} w="150px" /><L i={2} w="90px" /></div>
          </div>
          <div className="flex flex-wrap gap-2"><WPill i={2} w={60} /><WPill i={3} w={150} /></div>
        </div>
        {baru > 0 && <WBtn i={3} w={170} />}

        <div className="relative flex gap-7">
          {TABS.map((x) => (
            <span key={x.key} className="relative flex min-h-12 items-center">
              <WText i={3} className={cx('font-medium whitespace-nowrap', x.key === tab && 'font-semibold')}>{x.label}</WText>
              {x.key === tab && <WLine i={3} className="absolute inset-x-0 bottom-0 z-[1] border-t-2!" />}
            </span>
          ))}
          <Hair i={3} />
        </div>

        <CaseTabs tab={tab} code={code} />
      </div>

      <aside className="border-t border-line bg-white xl:sticky xl:top-0 xl:h-dvh xl:w-[360px] xl:shrink-0 xl:border-t-0 xl:border-l">
        <WChat i={5} title="Percakapan dengan pelapor" bubbles={messages} side={(k) => pick(base, `b${k}`, k % 2 ? 2 : 1, 2)} templates className="h-full max-h-[720px] xl:max-h-none" />
      </aside>
    </div>
  )
}

/** Detail kasus di dalam tata letak Laporan masuk. */
export function AdminCaseWire() {
  return (
    <Wire label="Memuat kasus…">
      <CaseBody />
    </Wire>
  )
}

/** Tata letak Laporan masuk: kepala, daftar kasus, detail atau petunjuk pilih. */
export function AdminLaporanWire() {
  const { pathname } = useWireRoute()
  const selected = /^\/admin\/laporan\/[^/]+/.test(pathname)
  const list = useShape('/admin/laporan')
  const n = pick(list, 'items', 4, 12)
  return (
    <Wire className="flex min-h-[calc(100dvh-56px)] flex-col lg:min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-4 md:px-6">
        <div className="flex flex-col">
          <WText as="h1" i={0} className="text-[20px] font-semibold md:text-[22px]">Laporan masuk</WText>
          <L i={1} w="320px" h={19.5} className="max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2"><WPill i={1} w={64} /><WPill i={2} w={86} /><WPill i={2} w={78} /></div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className={cx('flex min-h-0 flex-col border-line bg-white lg:w-[300px] lg:shrink-0 lg:border-r', selected && 'hidden lg:flex')}>
          <div className="flex gap-1.5 overflow-hidden border-b border-line p-3">
            {LIST_FILTERS.map((f, k) => (
              <WBox key={f} i={2 + k} r={999} className={cx('inline-flex h-9 shrink-0 items-center px-2.5', k === 0 && 'wire-on')}>
                <WText i={2 + k} className="text-[13px] font-semibold">{f}</WText>
              </WBox>
            ))}
          </div>
          {Array.from({ length: n }, (_, k) => (
            <div key={k} className="relative flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-2"><L i={3 + k} w="70px" h={24} /><WPill i={4 + k} w={62} /></div>
              <L i={4 + k} w={`${62 - (k % 3) * 10}%`} h={24} />
              <L i={5 + k} w="58%" h={19.5} />
              <Hair i={5 + k} />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <CaseBody />
          ) : (
            <div className="hidden h-full flex-col items-center justify-center gap-2 p-10 lg:flex">
              <WNode i={3} size={26} />
              <L i={4} w="200px" h={24} />
              <L i={5} w="260px" h={19.5} />
            </div>
          )}
        </div>
      </div>
    </Wire>
  )
}

/* ── Halaman alat admin ──────────────────────────────── */

export function PindaiWire() {
  const s = useShape()
  const rows = pick(s, 'rows', 6, 12)
  return (
    <Wire className={PAD}>
      <Header title="Pindai checkpoint" lines={[4, 2]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <WBox i={2} className="flex flex-col gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <WField i={3} label="40%" />
            <WField i={3} label="30%" />
            <WField i={4} label="46%" />
            <WField i={4} label="42%" />
            <div className="flex flex-col md:col-span-2">
              <L i={5} w="30%" h={19.5} className="mb-1.5" />
              <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((k) => <WBox key={k} i={5 + k} r={6} className="h-12" />)}</div>
            </div>
          </div>
          <WBtn i={7} w={190} />
        </WBox>
        <WBox i={3} className="flex flex-col gap-3">
          <WText as="h2" i={3} className={cx(H3, 'px-5 pt-5')}>Pindai terbaru</WText>
          <div className="overflow-hidden">
            <Table i={4} className="min-w-[560px]" cols="110px 150px 1fr 1.3fr 90px" heads={['Waktu', 'Resi', 'Hub', 'Berat, ukuran, segel', 'Hasil']} rows={rows} pillCol={4} />
          </div>
        </WBox>
      </div>
    </Wire>
  )
}

export function AuditWire() {
  const s = useShape()
  const rows = pick(s, 'rows', 8, 12)
  return (
    <Wire className={PAD}>
      <Header title="Log audit" />
      <WBox i={2} className="hidden md:block">
        <Table i={3} cols="140px 100px 1fr 160px" heads={['Waktu', 'Kasus', 'Kejadian', 'Pelaku']} rows={rows} />
      </WBox>
      <div className="relative flex flex-col md:hidden">
        <Hair i={2} top />
        {Array.from({ length: rows }, (_, k) => (
          <div key={k} className="relative flex flex-col gap-1 py-3.5">
            <L i={3 + k} w="150px" h={19.5} />
            <L i={3 + k} w={`${80 - (k % 3) * 12}%`} h={24} />
            <L i={4 + k} w="90px" h={19.5} />
            <Hair i={4 + k} />
          </div>
        ))}
      </div>
    </Wire>
  )
}

export function InsidenWire() {
  const s = useShape()
  const rows = pick(s, 'rows', 4, 12)
  return (
    <Wire className={PAD}>
      <Header title="Insiden publik" lines={[2, 1]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <WBox i={2} className="flex flex-col gap-3 p-5">
          <L i={2} w="45%" h={27} />
          <WField i={3} label="34%" />
          <div className="grid gap-3 md:grid-cols-2"><WField i={4} label="50%" /><WField i={4} label="60%" /></div>
          <WField i={5} label="22%" />
          <WField i={5} label="40%" h={68} />
          <WField i={6} label="30%" h={68} />
          <WBtn i={7} w={150} />
        </WBox>
        <section className="flex flex-col gap-2">
          <L i={3} w="230px" h={27} />
          <div className="relative">
            <Hair i={3} top />
            {Array.from({ length: rows }, (_, k) => (
              <div key={k} className="relative flex flex-col gap-1.5 py-4">
                <div className="flex items-center justify-between gap-2"><L i={4 + k} w="56%" h={19.5} /><WPill i={4 + k} w={60} /></div>
                <L i={5 + k} w="62%" h={24} />
                <WPara i={5 + k} lines={[2, 1]} lh={19.5} last="70%" />
                <Hair i={6 + k} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Wire>
  )
}


/**
 * Pemilih kerangka menurut URL tujuan untuk admin/loading.tsx. Itu batas pertama saat masuk
 * panel admin dari luar (mis. setelah masuk), jadi harus mengikuti halaman tujuan.
 */
export function AdminRouteWire() {
  const { pathname } = useWireRoute()
  switch (pathname.split('/')[2] ?? '') {
    case '': return <AdminDashWire />
    case 'pindai': return <PindaiWire />
    case 'audit': return <AuditWire />
    case 'insiden': return <InsidenWire />
    case 'akun': return <AkunWire admin />
    default: return <AdminLaporanWire />
  }
}
