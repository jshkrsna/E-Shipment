/**
 * Pembantu "bentuk" untuk wireframe pemuatan (lihat components/wire/memo.tsx).
 * Modul biasa agar bisa dipanggil dari Server Component.
 */

/** Sisi tiap pesan percakapan: 0 = catatan sistem, 1 = kiri (lawan bicara), 2 = kanan (milik penampil). */
export function bubbleShape(messages: { senderRole: string }[], viewer: string) {
  return Object.fromEntries(messages.slice(0, 4).map((m, k) => [`b${k}`, m.senderRole === 'sistem' ? 0 : m.senderRole === viewer ? 2 : 1]))
}
