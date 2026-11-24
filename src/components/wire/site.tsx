'use client'

import { CATEGORY_OPTIONS, INCIDENT_TYPES, USER_STEPS } from '@/lib/labels'
import { cx } from '../ui'
import { pick, useShape, useWireRoute } from './memo'
import { WBox, WBtn, WChat, WField, WFilter, WKV, WLine, WNode, WPara, WPill, WRow, WRule, WStepper, WText, WTimeline, Wire, at } from './primitives'

/*
 * Wireframe halaman Penerima. Setiap kerangka memakai kelas tata letak yang sama dengan
 * page.tsx-nya, menulis teks yang sudah pasti (judul, resi/kode dari URL, label tab & filter),
 * dan menyesuaikan jumlah baris dengan bentuk konten terakhir (WireMemo).
 */

const H1 = 'text-[30px] leading-tight font-semibold tracking-[-0.025em] md:text-[40px]'
const H1M = 'text-[26px] leading-tight font-semibold tracking-[-0.02em] md:text-[32px]'
const H2 = 'text-[21px] leading-tight font-semibold'
const H3 = 'text-[17px] font-semibold'

const seg = (pathname: string, n: number) => decodeURIComponent(pathname.split('/')[n] ?? '').toUpperCase()

/** Garis teks satu baris dengan tinggi baris tertentu. */
function L({ i, w, h = 24, className }: { i?: number; w: string | number; h?: number; className?: string }) {
  return (
    <span className={cx('flex items-center', className)} style={{ height: h }}>
      <WLine i={i} w={w} />
    </span>
  )
}

/** Garis pemisah bawah untuk baris daftar. */
const Hair = ({ i, top }: { i?: number; top?: boolean }) => <WRule i={i} className={cx('absolute inset-x-0', top ? 'top-0' : 'bottom-0')} />

/* ── Beranda ─────────────────────────────────────────── */

const CUSTODY = [
  ['Diambil kurir', 1],
  ['Hub transit', 2],
  ['Dalam pengantaran', 1],
  ['Diterima', 2],
] as const
const STEPS = ['Lacak dengan nomor resi', 'Simpan bukti unboxing', 'Laporkan bila ada masalah']

export function HomeWire() {
  const s = useShape('/')
  const inc = pick(s, 'incidents', 3, 3)
  return (
    <Wire>
      <div className="wx pt-12 pb-16 md:pt-20 lg:pb-24">
        <div className="flex max-w-[760px] flex-col gap-6">
          <WText as="h1" i={0} className="text-[36px] leading-[1.08] font-semibold tracking-[-0.03em] md:text-[52px]">Lacak paket dengan bukti, bukan sekadar status.</WText>
          <WPara i={1} lines={[5, 2]} lh={27.6} className="max-w-[54ch]" />
          <div className="mt-2 max-w-[640px]">
            <WBox i={3} className="flex flex-col gap-2 p-2 sm:flex-row">
              <div className="flex min-h-12 min-w-0 grow items-center px-3">
                <WText i={4} className="font-mono text-[17px] tracking-[0.01em] md:text-[19px]">JT110461625999</WText>
              </div>
              <WBox i={4} r={6} className="h-12 w-full sm:w-[132px]" />
            </WBox>
            <WPara i={5} lines={[2, 1]} lh={19.5} last="64%" className="mt-2" />
            <L i={6} w="230px" h={19.5} className="mt-3" />
          </div>
        </div>

        <div className="mt-16 md:mt-20">
          <ol className="relative grid gap-7 pl-7 md:grid-cols-4 md:gap-6 md:pl-0">
            <span aria-hidden className="wire-vbar absolute top-1.5 bottom-6 left-[5px] md:hidden" style={at(7)} />
            <WLine i={7} w="auto" className="absolute top-[5.5px] right-[calc(25%-18px)] left-1 hidden md:block" />
            {CUSTODY.map(([place, lines], k) => (
              <li key={place} className="relative flex flex-col gap-1.5 md:pt-8 md:pr-6">
                <WNode i={8 + k} size={11} className={cx('absolute top-0.5 -left-7 bg-bg md:top-0 md:left-0', k < 3 && 'wire-node-fill')} />
                <WText i={8 + k} className="font-semibold">{place}</WText>
                <WPara i={9 + k} lines={[lines, 2]} lh={22.4} last="66%" className="max-w-[30ch]" />
              </li>
            ))}
          </ol>
          <L i={12} w="340px" h={19.5} className="mt-8 max-w-full" />
        </div>
      </div>

      <section className="wx pb-16 lg:pb-24">
        <div className="relative pt-8 md:pt-10">
          <Hair i={12} top />
          <WText as="h2" i={13} className={H2}>Cara kerja</WText>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((t, k) => (
              <li key={t} className="flex gap-4">
                <WText i={13 + k} className="num font-semibold">{k + 1}</WText>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <WText i={13 + k} className="font-semibold">{t}</WText>
                  <WPara i={14 + k} lines={[2, 2]} last="70%" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wire-light bg-navy">
        <div className="wx grid gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
          <div className="flex max-w-[620px] flex-col gap-5">
            <WText as="h2" i={14} className="text-[26px] leading-tight font-semibold md:text-[34px]">Paket tertukar di jalur pengiriman, penerima dituduh lebih dulu.</WText>
            <WPara i={15} lines={[5, 3]} lh={26} />
            <L i={16} w="230px" h={19.5} />
            <WBtn i={16} w={150} className="mt-2" />
          </div>
          <div className="relative flex flex-col gap-4 pt-8 lg:pt-0 lg:pl-10">
            <WRule i={16} className="absolute inset-x-0 top-0 lg:hidden" />
            <span aria-hidden className="wire-vbar absolute inset-y-0 left-0 hidden lg:block" style={at(16)} />
            <WText as="h3" i={16} className={H3}>Ada masalah dengan paket?</WText>
            <WPara i={16} lines={[4, 3]} />
            <WBtn i={16} w={176} />
          </div>
        </div>
      </section>

      <section className="wx py-16 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="flex min-w-0 flex-col gap-1">
            <WText as="h2" i={16} className={H2}>Pengungkapan insiden terbaru</WText>
            <WPara i={16} lines={[2, 1]} className="w-[min(420px,80vw)]" />
          </div>
          <L i={16} w="80px" h={22} />
        </div>
        <div className="relative mt-8">
          <Hair i={16} top />
          {Array.from({ length: inc }, (_, k) => (
            <div key={k} className="relative py-5">
              <WRow i={16} pill={150} />
              <Hair i={16} />
            </div>
          ))}
        </div>
      </section>
    </Wire>
  )
}

/* ── Lacak ───────────────────────────────────────────── */

export function LacakIndexWire() {
  const { params } = useWireRoute()
  const many = (params.get('resi') ?? '').split(/[\s,;]+/).filter(Boolean).map((x) => x.toUpperCase())
  const results = many.length > 1 ? many.slice(0, 8) : []
  return (
    <Wire className="wx flex max-w-[760px] flex-col gap-6 py-10 lg:py-16">
      <div className="flex flex-col gap-2">
        <WText as="h1" i={0} className={H1}>Lacak paket dengan bukti</WText>
        <WPara i={1} lines={[3, 1]} last="72%" />
      </div>
      <WBox i={2} className="flex flex-col gap-4 p-5">
        <div className="flex flex-col">
          <L i={3} w="90px" h={19.5} className="mb-1.5" />
          <WBox i={3} r={6} className="flex h-[74px] items-start px-3.5 py-2.5">
            {many.length > 0 && <WText i={4} className="font-mono">{many.slice(0, 2).join(' ')}</WText>}
          </WBox>
          <WPara i={4} lines={[3, 2]} lh={19.5} last="40%" className="mt-1.5" />
        </div>
        <WBtn i={5} w={140} />
      </WBox>
      {results.length > 0 && (
        <section className="flex flex-col gap-2">
          <L i={6} w="200px" h={27} />
          {results.map((awb, k) => (
            <WBox key={awb + k} i={6 + k} className="flex items-center gap-4 px-5 py-4">
              <WNode i={6 + k} size={40} />
              <div className="flex min-w-0 flex-1 flex-col">
                <WText i={6 + k} className="font-mono font-semibold">{awb}</WText>
                <L i={7 + k} w="60%" h={20} />
              </div>
              <WPill i={7 + k} w={80} />
            </WBox>
          ))}
        </section>
      )}
    </Wire>
  )
}

type Tab = 'linimasa' | 'rute' | 'bukti'
const tabOf = (p: string): Tab => (p.endsWith('/rute') ? 'rute' : p.endsWith('/bukti') ? 'bukti' : 'linimasa')

/** Peta rute skematis: geometri sama dengan RouteSchematic. */
function RouteWire({ n, bad }: { n: number; bad: number }) {
  const W = 340
  const H = 200
  const pts = Array.from({ length: n }, (_, i) => ({ x: 40 + (i * (W - 80)) / Math.max(1, n - 1), y: 50 + (i % 2 === 0 ? 0 : 50) + i * 18 }))
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="wire-path h-auto w-full" aria-hidden>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} pathLength={1} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === bad ? 8 : 6} style={at(i)} className={i === bad ? 'wire-er' : ''} />
      ))}
    </svg>
  )
}

function TrackBody({ tab, awb, from = 0 }: { tab: Tab; awb: string; from?: number }) {
  const base = useShape(`/lacak/${awb}`)
  const rute = useShape(`/lacak/${awb}/rute`)
  const bukti = useShape(`/lacak/${awb}/bukti`)
  const i = from

  if (tab === 'linimasa') {
    const n = pick(base, 'events', 6, 12)
    return (
      <>
        <WTimeline from={i} n={n} bad={pick(base, 'bad', -1, 12)} gap={pick(base, 'gap', -1, 12)} lines={(k) => pick(base, `l${k}`, k % 2 === 0 ? 3 : 2, 3)} />
      </>
    )
  }

  if (tab === 'rute') {
    const nodes = pick(rute, 'nodes', 4, 10)
    const cards = pick(rute, 'checks', 5, 10)
    const banner = pick(rute, 'banner', 0, 1)
    return (
      <>
        {banner > 0 && <WBox i={i} r={6} tone="er" className="h-[148px] md:h-[100px]" />}
        <div className="relative flex flex-col gap-3 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <WText as="h2" i={i} className={H3}>Rute rencana dan rute aktual</WText>
            <L i={i + 1} w="150px" h={20} />
          </div>
          <RouteWire n={nodes} bad={pick(rute, 'bad', -1, 10)} />
          <L i={i + 2} w="160px" h={19.5} />
          <Hair i={i + 2} />
        </div>
        <WText as="h2" i={i + 3} className={H3}>Pemeriksaan identitas di setiap hub</WText>
        <div className="grid gap-3 xl:grid-cols-2">
          {Array.from({ length: cards }, (_, k) => (
            <WBox key={k} i={i + 3 + k} dashed={k === cards - 1 && pick(rute, 'gapCard', 0, 1) > 0} className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-2"><L i={i + 3 + k} w="52%" /><WPill i={i + 4 + k} w={92} /></div>
              <WKV i={i + 4 + k} rows={3} />
            </WBox>
          ))}
        </div>
      </>
    )
  }

  const owner = pick(bukti, 'owner', 0, 1)
  const files = pick(bukti, 'files', 0, 10)
  const canEdit = pick(bukti, 'canEdit', 0, 1)
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <WBox i={i} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-2"><WText i={i} className="font-semibold">Bukti pengambilan</WText><WPill i={i + 1} w={112} /></div>
          <WBox i={i + 1} r={6} className="h-36" />
          <WKV i={i + 2} rows={5} />
          <WPara i={i + 3} lines={[2, 1]} lh={19.5} />
        </WBox>
        <WBox i={i + 1} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-2"><WText i={i + 1} className="font-semibold">Bukti serah terima</WText><WPill i={i + 2} w={112} /></div>
          <div className="flex gap-3">
            <WBox i={i + 2} r={6} className="size-24 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <WPill i={i + 3} w={130} />
              <L i={i + 3} w="80%" />
              <L i={i + 4} w="65%" h={19.5} />
            </div>
          </div>
          <WPara i={i + 4} lines={[2, 1]} lh={19.5} />
        </WBox>
      </div>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2"><WText as="h2" i={i + 5} className={H3}>Brankas unboxing</WText><WPill i={i + 5} w={owner ? 160 : 110} /></div>
        {owner ? (
          <WBox i={i + 6} className="flex flex-col gap-3 p-5">
            {canEdit > 0 && <WBtn i={i + 6} className="w-full" />}
            {files === 0 ? (
              <WBox i={i + 7} r={6} dashed className="h-40" />
            ) : (
              <>
                <WBox i={i + 7} r={6} className="aspect-[4/3] w-full md:aspect-auto md:h-[360px]" />
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col"><L i={i + 8} w="55%" /><L i={i + 8} w="40%" h={19.5} /></div>
                  <WBtn i={i + 8} w={110} />
                  {canEdit > 0 && <WBtn i={i + 8} w={44} />}
                </div>
                <div className="flex gap-2 overflow-hidden pb-1">
                  {Array.from({ length: files }, (_, k) => <WBox key={k} i={i + 8 + k} r={6} className="size-16 shrink-0 md:size-20" />)}
                </div>
              </>
            )}
            <L i={i + 9} w="260px" h={19.5} />
          </WBox>
        ) : (
          <WBox i={i + 6} dashed className="flex flex-col gap-4 p-5">
            <WPara i={i + 6} lines={[3, 2]} />
            <div className="flex flex-wrap gap-2"><WBtn i={i + 7} w={230} /><WBtn i={i + 7} w={90} /></div>
          </WBox>
        )}
      </section>
      <WPara i={i + 9} lines={[3, 2]} lh={19.5} className="pl-3" />
    </>
  )
}

function TrackTabs({ tab, i }: { tab: Tab; i: number }) {
  return (
    <div className="relative flex gap-8 px-4 md:px-0 lg:px-6">
      {(['Linimasa', 'Rute', 'Bukti'] as const).map((label) => {
        const on = label.toLowerCase() === tab
        return (
          <span key={label} className="relative flex min-h-12 items-center">
            <WText i={i} className={cx('text-[14px] font-medium', on && 'font-semibold')}>{label}</WText>
            {on && <WLine i={i} className="absolute inset-x-0 -bottom-px z-[1] border-t-2!" />}
          </span>
        )
      })}
      <Hair i={i} />
    </div>
  )
}

/** /lacak/[resi] (tata letak + tab aktif). */
export function TrackWire() {
  const { pathname } = useWireRoute()
  const awb = seg(pathname, 2)
  const tab = tabOf(pathname)
  const base = useShape(`/lacak/${awb}`)
  const alert = pick(base, 'alert', 0, 1)
  const chips = pick(base, 'chips', 0, 2)
  const bar = pick(base, 'bar', 1, 1)
  return (
    <Wire>
      <div className="pb-24 lg:pb-16">
        <div className="wx flex flex-col gap-6 pt-5 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-10 lg:pt-10">
          <aside className="flex flex-col gap-6">
            <div className="flex items-center gap-1">
              <span className="-ml-2.5 grid size-11 shrink-0 place-items-center"><WLine i={0} w={16} /></span>
              <div className="flex min-w-0 flex-1 gap-2">
                <WBox i={0} r={6} className="flex h-12 min-w-0 grow items-center px-3.5"><WText i={1} className="truncate font-mono text-[14px]">{awb}</WText></WBox>
                <WBox i={1} r={6} className="size-12 shrink-0" />
              </div>
            </div>
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <WText i={2} className="font-mono text-[22px] leading-none font-medium tracking-[-0.01em] break-all md:text-[26px]">{awb}</WText>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><WBox i={3} r={6} className="h-[35px] w-[150px]" /><WPill i={4} w={112} /></div>
                <L i={5} w="74%" />
              </div>
              <div className="relative pt-5">
                <Hair i={5} top />
                <WKV i={6} rows={5} />
              </div>
              {chips > 0 && <div className="flex gap-2"><WPill i={8} w={100} />{chips > 1 && <WPill i={8} w={130} />}</div>}
            </section>
            {alert > 0 && <WBox i={9} r={6} tone="er" className="h-[124px]" />}
            {bar > 0 && <div className="hidden lg:flex"><WBtn i={10} className="grow" /></div>}
          </aside>

          <section className="relative -mx-4 min-w-0 bg-white md:mx-0 md:rounded-p">
            <WBox i={2} className="pointer-events-none absolute! inset-0 hidden md:block" />
            <Hair i={2} top />
            <span className="md:hidden"><Hair i={2} /></span>
            <TrackTabs tab={tab} i={3} />
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
              <TrackBody tab={tab} awb={awb} from={4} />
            </div>
          </section>
        </div>
        {bar > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 lg:hidden">
            <WBtn i={10} className="w-full" />
          </div>
        )}
      </div>
    </Wire>
  )
}

/** Isi tab saja (tata letak pelacakan tetap tampil). */
export function TrackTabWire() {
  const { pathname } = useWireRoute()
  return (
    <Wire className="flex flex-col gap-6">
      <TrackBody tab={tabOf(pathname)} awb={seg(pathname, 2)} />
    </Wire>
  )
}

/* ── Kasus ───────────────────────────────────────────── */

function Bullets({ i, n, title }: { i: number; n: number; title: string }) {
  return (
    <section className="relative flex flex-col gap-3 pt-4">
      <WLine i={i} className="absolute inset-x-0 top-0 border-t-2!" />
      <div className="flex items-center gap-2"><WNode i={i} size={14} /><WText as="h2" i={i} className={H3}>{title}</WText></div>
      <ul className="flex flex-col gap-2">
        {Array.from({ length: n }, (_, k) => (
          <li key={k} className="flex gap-3">
            <span className="flex h-6 items-center"><WNode i={i + k} size={5} /></span>
            <WPara i={i + k} lines={[2, k % 2 ? 1 : 2]} last="62%" className="flex-1" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CaseWire() {
  const { pathname } = useWireRoute()
  const code = seg(pathname, 2)
  const s = useShape()
  const closed = pick(s, 'closed', 0, 1)
  const banners = pick(s, 'banners', closed ? 0 : 1, 2)
  const known = pick(s, 'known', 4, 6)
  const checking = pick(s, 'checking', closed ? 0 : 3, 6)
  const evidence = pick(s, 'evidence', 3, 10)
  const history = pick(s, 'history', 3, 10)
  const messages = pick(s, 'messages', 2, 4)
  return (
    <Wire className="wx flex flex-col gap-8 pt-6 pb-16 lg:pt-10">
      <header className="flex flex-col gap-3">
        <span className="-ml-1 flex min-h-9 items-center gap-1.5"><WLine i={0} w={14} /><WText i={0} className="text-[14px] font-medium">Kasus saya</WText></span>
        <WText as="h1" i={1} className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-[36px]">
          Kasus <span className="font-mono font-medium tracking-normal">{code}</span>
        </WText>
        <div className="flex flex-wrap gap-x-4 gap-y-1"><L i={2} w="110px" h={22.4} /><L i={2} w="130px" h={22.4} /><L i={3} w="140px" h={22.4} /></div>
      </header>

      {banners > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: banners }, (_, k) => <WBox key={k} i={3 + k} r={6} className="h-[72px] sm:h-12" />)}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-12">
          <WBox i={4} className="flex flex-col gap-6 p-6">
            <WStepper i={5} steps={USER_STEPS} current={pick(s, 'step', 0, 3)} done={closed > 0} />
            <WPara i={6} lines={[4, 2]} className="max-w-[62ch]" />
            {closed ? (
              <WBox i={7} r={6} className="h-12" />
            ) : (
              <div className="relative flex flex-col gap-3 pt-5">
                <Hair i={7} top />
                <div className="flex items-center justify-between gap-2"><L i={7} w="150px" /><WPill i={8} w={128} /></div>
                <WLine i={8} />
                <WPara i={8} lines={[2, 1]} lh={19.5} last="70%" />
              </div>
            )}
          </WBox>

          <div className="grid gap-10 md:grid-cols-2">
            <Bullets i={8} n={known} title="Yang kami ketahui" />
            {checking > 0 && <Bullets i={9} n={checking} title="Yang sedang kami periksa" />}
          </div>

          <section className="flex flex-col gap-4">
            <WText as="h2" i={10} className={H3}>Cerita Anda</WText>
            <div className="relative pl-5">
              <span aria-hidden className="wire-vbar absolute inset-y-0 left-0" style={at(10)} />
              <WPara i={10} lines={[3, 2]} lh={25.6} />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <WText as="h2" i={11} className={H3}>Bukti dalam kasus</WText>
            <div className="relative">
              <Hair i={11} top />
              {Array.from({ length: Math.max(1, evidence) }, (_, k) => (
                <div key={k} className="relative flex items-center justify-between gap-3 py-3.5">
                  <L i={11 + k} w={`${48 - (k % 3) * 8}%`} />
                  {evidence > 0 && <WPill i={12 + k} w={k ? 84 : 104} />}
                  <Hair i={12 + k} />
                </div>
              ))}
            </div>
            <L i={12} w="320px" h={19.5} className="max-w-full" />
          </section>

          <section className="flex flex-col gap-5">
            <WText as="h2" i={12} className={H3}>Riwayat kasus</WText>
            <WTimeline from={12} n={history} compact />
          </section>

          <section className="relative flex flex-col gap-2 pt-6">
            <Hair i={14} top />
            <div className="flex items-center justify-between gap-2"><WText as="h2" i={14} className={H3}>Pengembalian dana</WText><WPill i={14} w={104} /></div>
            <WPara i={14} lines={[2, 1]} lh={22.4} last="64%" />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <WBox i={5} className="flex max-h-[640px] flex-col">
            <WChat i={6} title="Percakapan dengan admin ekspedisi" bubbles={messages} side={(k) => pick(s, `b${k}`, k % 2 ? 1 : 2, 2)} className="min-h-[420px]" />
          </WBox>
          <WBtn i={8} className="w-full" />
          {pick(s, 'share', 0, 1) > 0 && (
            <WBox i={9} className="flex flex-col gap-2.5 p-4">
              <L i={9} w="45%" h={19.5} />
              <WBox i={9} r={6} className="h-12" />
              <L i={10} w="85%" h={19.5} />
              <div className="flex gap-2"><WBtn i={10} sm w={80} /><WBtn i={10} sm w={72} /><WBtn i={11} sm w={110} /></div>
            </WBox>
          )}
          <WPara i={11} lines={[2, 2]} lh={19.5} last="50%" />
          <L i={11} w="190px" h={19.5} />
        </aside>
      </div>
    </Wire>
  )
}

/** Daftar dengan kartu bertaut (Kasus saya / pilih paket). */
function LinkCards({ i, n, pill, mono }: { i: number; n: number; pill: number; mono?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: n }, (_, k) => (
        <li key={k}>
          <WBox i={i + k} className="flex items-center gap-4 px-5 py-4">
            <WNode i={i + k} size={40} />
            <div className="flex min-w-0 flex-1 flex-col">
              <L i={i + k} w={mono ? '150px' : '62%'} />
              <L i={i + k + 1} w="48%" h={19.5} />
            </div>
            <WPill i={i + k + 1} w={pill} />
          </WBox>
        </li>
      ))}
    </ul>
  )
}

export function KasusListWire() {
  const s = useShape()
  const n = pick(s, 'cases', 3, 10)
  return (
    <Wire className="wx flex max-w-[860px] flex-col gap-6 py-10 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <WText as="h1" i={0} className={H1}>Kasus saya</WText>
        <WBtn i={1} w={196} />
      </div>
      {n === 0 ? <WBox i={2} dashed className="h-[176px]" /> : <LinkCards i={2} n={n} pill={96} />}
    </Wire>
  )
}

/* ── Lapor ───────────────────────────────────────────── */

export function LaporPickWire() {
  const s = useShape()
  const n = pick(s, 'shipments', 2, 10)
  return (
    <Wire className="wx flex max-w-[760px] flex-col gap-6 py-10 lg:py-16">
      <div className="flex flex-col gap-1">
        <WText as="h1" i={0} className={H1}>Paket mana yang bermasalah?</WText>
        <WPara i={1} lines={[3, 1]} last="94%" />
      </div>
      {n === 0 ? <WBox i={2} dashed className="h-[176px]" /> : <LinkCards i={2} n={n} pill={104} mono />}
      <WBox i={4} className="flex flex-col gap-3 p-5">
        <WText as="h2" i={4} className={H3}>Paket lain</WText>
        <WBox i={5} className="flex flex-col gap-4 p-5">
          <WField i={5} label="90px" />
          <WPara i={6} lines={[3, 2]} lh={19.5} last="40%" />
          <WBtn i={7} w={140} />
        </WBox>
      </WBox>
    </Wire>
  )
}

function LaporHeader({ awb }: { awb: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-11 place-items-center"><WLine i={0} w={18} /></span>
      <div className="flex flex-col">
        <WText as="h1" i={0} className={H1M}>Laporkan masalah</WText>
        <WText i={1} className="font-mono text-[13px]">{awb}</WText>
      </div>
    </div>
  )
}

export function LaporFormWire() {
  const { pathname } = useWireRoute()
  const awb = seg(pathname, 2)
  const s = useShape()
  const owner = pick(s, 'owner', 1, 1)
  const ev = pick(s, 'evidence', 2, 8)

  if (!owner) {
    return (
      <Wire className="wx flex max-w-[640px] flex-col gap-5 py-6 lg:py-10">
        <LaporHeader awb={awb} />
        <WBox i={2} className="flex flex-col gap-3 p-5">
          <L i={2} w="80%" />
          <WField i={3} label="40%" />
          <WBtn i={4} w={150} />
        </WBox>
      </Wire>
    )
  }

  return (
    <Wire className="wx grid max-w-[1100px] gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10">
      <div className="flex min-w-0 flex-col gap-5">
        <LaporHeader awb={awb} />
        <div className="flex flex-col gap-5">
          <WBox i={2} r={6} className="h-[72px] sm:h-12" />
          <div className="flex flex-col gap-2">
            <L i={3} w="140px" h={19.5} className="mb-1.5" />
            <div className="grid gap-2 md:grid-cols-2">
              {CATEGORY_OPTIONS.map((o, k) => (
                <WBox key={o.value} i={3 + k} r={6} className="flex min-h-12 items-center gap-3 px-3 py-2">
                  <WNode i={3 + k} size={20} />
                  <WText i={3 + k}>{o.label}</WText>
                </WBox>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <L i={8} w="110px" h={19.5} />
            <WBox i={8} r={6} className="flex flex-col">
              <div className="relative flex h-10 items-center gap-3 px-3">{[0, 1, 2, 3, 4].map((k) => <WLine key={k} i={8 + k} w={14} />)}<Hair i={9} /></div>
              <div className="h-[140px] px-3.5 py-3"><L i={9} w="54%" /></div>
            </WBox>
            <WPara i={9} lines={[3, 2]} lh={19.5} last="44%" />
          </div>
          <div className="flex flex-col gap-2">
            <L i={10} w="170px" h={19.5} />
            {ev === 0 ? (
              <WPara i={10} lines={[2, 1]} lh={19.5} className="pl-3" />
            ) : (
              Array.from({ length: ev }, (_, k) => (
                <WBox key={k} i={10 + k} r={6} className="flex min-h-12 items-center gap-3 px-3 py-2">
                  <WNode i={10 + k} size={20} />
                  <L i={10 + k} w="50%" className="flex-1" />
                  <WPill i={11 + k} w={92} />
                </WBox>
              ))
            )}
            <WPara i={11} lines={[3, 2]} lh={19.5} last="50%" />
          </div>
          <div className="flex flex-col gap-2">
            <L i={12} w="130px" h={19.5} className="mb-1.5" />
            <div className="flex gap-2">
              <WBox i={12} r={6} className="flex min-h-12 flex-1 items-center gap-3 px-3"><WNode i={12} size={20} /><WText i={12}>WhatsApp</WText></WBox>
              <WBox i={13} r={6} className="flex min-h-12 flex-1 items-center gap-3 px-3"><WNode i={13} size={20} /><WText i={13}>Email</WText></WBox>
            </div>
          </div>
          <WBtn i={14} className="w-full md:w-56" />
        </div>
      </div>
      <aside className="hidden flex-col gap-3 lg:flex lg:pt-16">
        <WBox i={3} className="flex flex-col gap-2 p-5">
          <WText i={3} className="font-mono text-[17px] font-medium">{awb}</WText>
          <L i={4} w="80%" h={19.5} />
          <L i={4} w="60%" h={19.5} />
        </WBox>
        <WPara i={5} lines={[5, 5]} lh={19.5} className="pl-3" />
      </aside>
    </Wire>
  )
}

/* ── Akun ────────────────────────────────────────────── */

export function AuthWire() {
  const { pathname } = useWireRoute()
  const daftar = pathname.startsWith('/daftar')
  return (
    <Wire className="wx flex max-w-[440px] flex-col gap-5 py-10">
      <div className="flex flex-col gap-1">
        <WText as="h1" i={0} className={H1M}>{daftar ? 'Buat akun Pengguna' : 'Masuk'}</WText>
        <WPara i={1} lines={[3, 2]} last="62%" />
      </div>
      <WBox i={2} className="flex flex-col gap-4 p-5">
        {daftar && (
          <>
            <WField i={3} label="110px" />
            <WField i={4} label="140px" hint />
          </>
        )}
        <WField i={5} label="50px" />
        <WField i={6} label="80px" hint={daftar} />
        <WBtn i={7} className="w-full" />
        <span className="flex h-[19.5px] items-center justify-center"><WLine i={8} w="56%" /></span>
      </WBox>
    </Wire>
  )
}

/** Profil (Penerima & admin memakai ProfileForm yang sama). */
export function AkunWire({ admin }: { admin?: boolean }) {
  return (
    <Wire className={admin ? 'flex flex-col gap-8 px-4 py-6 md:px-8 lg:px-10 lg:py-10' : 'wx flex max-w-[960px] flex-col gap-6 py-10 lg:py-16'}>
      <div className="flex flex-col gap-1">
        <WText as="h1" i={0} className={admin ? 'text-[24px] leading-tight font-semibold md:text-[28px]' : H1M}>Profil saya</WText>
        <L i={1} w="280px" className="max-w-full" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <WBox i={2} className="flex flex-col gap-4 p-5">
          <WText as="h2" i={2} className={H3}>Data akun</WText>
          <WField i={3} label="110px" />
          <WField i={4} label="50px" />
          <WField i={5} label="140px" hint={!admin} />
          <WBtn i={6} w={170} />
        </WBox>
        <WBox i={3} className="flex flex-col gap-4 p-5">
          <WText as="h2" i={3} className={H3}>Ganti kata sandi</WText>
          <WField i={4} label="130px" hint />
          <WField i={5} label="170px" />
          <WBtn i={6} w={170} />
        </WBox>
      </div>
    </Wire>
  )
}

/* ── Halaman informasi ───────────────────────────────── */

function IncidentRows({ rows }: { rows: number }) {
  return (
    <>
      <WBox i={4} className="hidden md:block">
        <div className="relative grid grid-cols-[110px_1.2fr_1.3fr_110px_1.5fr] gap-4 px-4 py-3">
          {['ID', 'Jenis insiden', 'Penyebab terkonfirmasi', 'Waktu penyelesaian', 'Perbaikan'].map((h, k) => <WText key={h} i={4 + k} className="text-[13px] font-medium">{h}</WText>)}
          <Hair i={5} />
        </div>
        {Array.from({ length: rows }, (_, k) => (
          <div key={k} className="relative grid grid-cols-[110px_1.2fr_1.3fr_110px_1.5fr] items-center gap-4 px-4 py-4">
            <L i={5 + k} w="90px" />
            <L i={5 + k} w="80%" />
            <L i={6 + k} w="72%" />
            <WPill i={6 + k} w={70} />
            <L i={7 + k} w="84%" />
            {k < rows - 1 && <Hair i={7 + k} />}
          </div>
        ))}
      </WBox>

      <div className="relative flex flex-col md:hidden">
        <Hair i={4} top />
        {Array.from({ length: rows }, (_, k) => (
          <div key={k} className="relative flex flex-col gap-2 py-5">
            <div className="flex items-center justify-between gap-2"><L i={4 + k} w="110px" h={20} /><WPill i={5 + k} w={70} /></div>
            <L i={5 + k} w="70%" />
            <WKV i={5 + k} rows={2} />
            <Hair i={6 + k} />
          </div>
        ))}
      </div>
    </>
  )
}

/** Wireframe tabel insiden saat filter (?jenis=) berganti. */
export function TransparansiRowsWire() {
  const s = useShape()
  return (
    <Wire className="flex flex-col gap-8" label="Memuat insiden…">
      <IncidentRows rows={pick(s, 'rows', 4, 12)} />
    </Wire>
  )
}

export function TransparansiWire() {
  const { params } = useWireRoute()
  const active = params.get('jenis')
  const s = useShape()
  const rows = pick(s, 'rows', 4, 12)
  const types = INCIDENT_TYPES.filter((t) => t !== 'Lainnya')
  return (
    <Wire className="wx flex flex-col gap-8 py-12 lg:py-16">
      <div className="flex max-w-[720px] flex-col gap-4">
        <WText as="h1" i={0} className="text-[30px] leading-tight font-semibold tracking-[-0.025em] md:text-[42px]">Pengungkapan insiden</WText>
        <WPara i={1} lines={[4, 2]} lh={27.6} last="40%" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <WFilter i={2} on={!active}>Semua</WFilter>
        {types.map((t, k) => <WFilter key={t} i={3 + k} on={active === t}>{t}</WFilter>)}
        <span className="grow" />
        <L i={5} w="110px" h={20} />
      </div>

      <IncidentRows rows={rows} />
      <L i={8} w="300px" h={19.5} className="max-w-full pl-3" />
    </Wire>
  )
}

export function StudiKasusWire() {
  return (
    <Wire>
      <div className="wx flex flex-col gap-5 pt-12 pb-12 lg:pt-16">
        <WText i={0} className="text-[14px] font-medium">Studi kasus, disusun sesuai laporan</WText>
        <WText as="h1" i={0} className="max-w-[820px] text-[30px] leading-[1.12] font-semibold tracking-[-0.025em] md:text-[42px]">
          Saat data pelacakan tertutup, konsumen mudah disalahkan sementara penyebab sebenarnya tersembunyi.
        </WText>
        <WPara i={1} lines={[5, 2]} lh={27.6} last="76%" className="max-w-[62ch]" />
      </div>

      <section className="wx grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="flex flex-col gap-4">
          <WText as="h2" i={2} className={H2}>Kasus sebagaimana dilaporkan</WText>
          <div className="relative">
            <Hair i={2} top />
            {Array.from({ length: 7 }, (_, k) => (
              <div key={k} className="relative grid gap-1 py-3.5 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
                <L i={3 + k} w={`${60 + (k % 3) * 15}px`} />
                <WPara i={3 + k} lines={[k > 4 ? 2 : 1, 1]} last={`${52 + (k % 4) * 10}%`} />
                <Hair i={4 + k} />
              </div>
            ))}
          </div>
        </div>
        <aside className="flex flex-col gap-3 lg:pt-12">
          <WBox i={4} r={6} tone="wn" className="h-[112px]" />
          <WBox i={5} r={6} className="h-[86px]" />
        </aside>
      </section>

      <section className="wx pb-16">
        <div className="relative pt-8 md:pt-10">
          <Hair i={8} top />
          <WText as="h2" i={8} className={H2}>Empat celah transparansi dan respons desain</WText>
          <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {[0, 1, 2, 3].map((k) => (
              <article key={k} className="relative flex flex-col gap-3 pl-5">
                <span aria-hidden className="wire-vbar wire-er absolute inset-y-0 left-0" style={at(9 + k)} />
                <WPara i={9 + k} lines={[3, 2]} lh={23.4} last="66%" />
                <WPara i={10 + k} lines={[3, 2]} last="52%" />
                <WPara i={10 + k} lines={[3, 2]} last="74%" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wx pb-20">
        <div className="relative pt-8 md:pt-10">
          <Hair i={12} top />
          <WText as="h2" i={12} className={cx(H2, 'mb-8 block')}>Sebelum dan sesudah</WText>
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((k) => (
              <WBox key={k} i={12 + k} dashed={k === 0} className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><L i={12 + k} w="58%" /><WPill i={13 + k} w={140} /></div>
                <ul className="flex flex-col gap-2 pl-5">{[0, 1, 2, 3].map((b) => <li key={b}><L i={13 + k + b} w={`${84 - b * 9}%`} /></li>)}</ul>
              </WBox>
            ))}
          </div>
          <L i={14} w="440px" h={19.5} className="mt-8 max-w-full pl-3" />
        </div>
      </section>
    </Wire>
  )
}

const CONTACT_TITLES = ['Call center JNE', 'Email customer care', 'Live chat JONI']

export function BantuanWire() {
  return (
    <Wire className="wx flex flex-col gap-8 py-10 lg:py-16">
      <div className="flex max-w-[720px] flex-col gap-2">
        <WText as="h1" i={0} className={H1}>Hubungi ekspedisi JNE</WText>
        <WPara i={1} lines={[4, 2]} lh={25.6} last="48%" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {CONTACT_TITLES.map((t, k) => (
          <WBox key={t} i={2 + k} className="flex flex-col gap-3 p-5">
            <WNode i={2 + k} size={44} />
            <div className="flex flex-col">
              <WText i={2 + k} className="text-[13px] font-semibold">{t}</WText>
              <L i={3 + k} w="70%" h={28.8} />
              <L i={3 + k} w="84%" h={19.5} />
            </div>
            <WBtn i={4 + k} className="mt-auto w-full" />
          </WBox>
        ))}
      </div>
      <WBox i={5} r={6} tone="wn" className="h-[92px] sm:h-[68px] lg:h-11" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col">
          <WText as="h2" i={6} className={cx(H2, 'mb-3 block')}>Pertanyaan umum</WText>
          <div className="relative">
            <Hair i={6} top />
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="relative flex min-h-[65px] items-center justify-between gap-3">
                <L i={7 + k} w={`${64 - (k % 3) * 9}%`} />
                <WLine i={7 + k} w={10} />
                <Hair i={7 + k} />
              </div>
            ))}
          </div>
        </section>
        <aside className="flex flex-col gap-4">
          <WBox i={7} className="flex flex-col gap-2 p-5">
            <WText as="h2" i={7} className={H3}>Siapkan sebelum menghubungi</WText>
            {[0, 1, 2, 3].map((k) => <L key={k} i={8 + k} w={`${74 - k * 8}%`} h={21} className="pl-5" />)}
          </WBox>
          <WBox i={8} className="flex flex-col gap-2 p-5">
            <WText as="h2" i={8} className={H3}>Pintasan</WText>
            <WBtn i={9} className="w-full" />
            <WBtn i={9} className="w-full" />
            <WBtn i={10} className="w-full" />
          </WBox>
        </aside>
      </div>
      <L i={10} w="520px" h={19.5} className="max-w-full pl-3" />
    </Wire>
  )
}

/** Tautan bukti hanya baca (/bukti/[token]). */
export function BuktiShareWire() {
  const s = useShape()
  const cards = pick(s, 'cards', 3, 4)
  const files = pick(s, 'files', 2, 6)
  return (
    <Wire className="wx flex max-w-[960px] flex-col gap-4 py-6 lg:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <WText i={0} className="text-[14px] font-medium">Bukti pengiriman, dibagikan pemilik kasus</WText>
          <div className="flex items-center gap-2"><WText as="h1" i={0} className={H1M}>Paket</WText><WBox i={1} r={6} className="h-8 w-[220px] md:h-9 md:w-[280px]" /></div>
          <L i={1} w="260px" className="max-w-full" />
        </div>
        <WPill i={2} w={104} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <WBox i={2} r={6} className="h-[72px]" />
        <WBox i={3} r={6} className="h-[72px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: cards }, (_, k) => {
          const last = k === cards - 1
          return (
            <WBox key={k} i={4 + k} className="flex flex-col gap-3 p-5">
              <div className="flex min-h-[26px] items-center justify-between gap-2"><L i={4 + k} w="50%" />{k > 0 && <WPill i={5 + k} w={110} />}</div>
              {last ? (
                <div className="grid grid-cols-2 gap-2">{Array.from({ length: Math.max(1, files) }, (_, f) => <WBox key={f} i={5 + k + f} r={6} className="aspect-[4/3] w-full" />)}</div>
              ) : (
                <>
                  {k === 1 && <WBox i={5 + k} r={6} className="h-28" />}
                  <WKV i={5 + k} rows={k === 0 ? 4 : 3} />
                </>
              )}
              <L i={6 + k} w="56%" h={19.5} />
            </WBox>
          )
        })}
      </div>
      <WBox i={8} className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2"><WNode i={8} size={18} /><L i={8} w="160px" /></div>
        <WPara i={9} lines={[3, 2]} lh={19.5} />
        {[0, 1, 2].map((k) => <L key={k} i={9 + k} w={`${92 - k * 10}%`} h={16.5} />)}
      </WBox>
    </Wire>
  )
}

/** Cadangan umum (halaman tanpa kerangka khusus). */
export function PageWire() {
  return (
    <Wire className="wx flex flex-col gap-6 py-10 lg:py-16">
      <div className="flex max-w-[720px] flex-col gap-3">
        <WBox i={0} r={6} className="h-10 w-[70%]" />
        <WPara i={1} lines={[3, 2]} />
      </div>
      <div className="relative mt-4">
        <Hair i={2} top />
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="relative py-5"><WRow i={3 + k} /><Hair i={4 + k} /></div>
        ))}
      </div>
    </Wire>
  )
}

/**
 * Pemilih kerangka menurut URL tujuan, untuk loading.tsx induk ((site), /lacak, /kasus, /lapor).
 * Next berhenti di loading.tsx pertama pada segmen baru, jadi masuk langsung ke /lacak/[resi]
 * dari halaman lain memakai loading.tsx /lacak. Tanpa pemilih ini yang tampil adalah kerangka daftar.
 */
export function SiteRouteWire() {
  const { pathname } = useWireRoute()
  const [, a = '', b] = pathname.split('/')
  switch (a) {
    case '': return <HomeWire />
    case 'lacak': return b ? <TrackWire /> : <LacakIndexWire />
    case 'kasus': return b ? <CaseWire /> : <KasusListWire />
    case 'lapor': return b ? <LaporFormWire /> : <LaporPickWire />
    case 'masuk':
    case 'daftar': return <AuthWire />
    case 'akun': return <AkunWire />
    case 'transparansi': return <TransparansiWire />
    case 'studi-kasus': return <StudiKasusWire />
    case 'bantuan': return <BantuanWire />
    case 'bukti': return b ? <BuktiShareWire /> : <PageWire />
    default: return <PageWire />
  }
}
