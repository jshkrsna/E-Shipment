import { AdminRouteWire } from '@/components/wire/admin'

// Batas pertama saat masuk panel admin dari luar (dan untuk Laporan masuk): kerangka mengikuti URL tujuan.
export default function Loading() {
  return <AdminRouteWire />
}
