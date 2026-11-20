/** Hapus database & unggahan lokal. Hentikan `npm run dev` terlebih dahulu. Data contoh dibuat ulang saat server dijalankan. */
import fs from 'node:fs'
import path from 'node:path'

const dir = path.join(process.cwd(), '.data')
fs.rmSync(dir, { recursive: true, force: true })
console.log('Folder .data dihapus. Jalankan `npm run dev` untuk membuat ulang data contoh.')
