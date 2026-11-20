# E-Shipmennt

Website pelacakan paket berbasis bukti dan penanganan sengketa, responsif untuk PC dan ponsel. Dibangun dari desain Figma "E-Shipment" (versi sesudah revisi P1–P3 dan A1–A3). Arsitektur lengkap ada di [`docs/MASTER-PLAN.md`](docs/MASTER-PLAN.md).

Peran: **Pengguna** (penerima paket) dan **Admin** (admin ekspedisi, termasuk fitur operator).

## Menjalankan di komputer

Butuh Node.js 20 atau lebih baru. Tidak perlu memasang PostgreSQL.

```bash
npm install
npm run dev          # http://localhost:3000
```

Saat pertama dijalankan, database lokal (PGlite, di `.data/pglite`) dibuat, dimigrasi, dan diisi data contoh secara otomatis.

Akun demo:

| Peran | Email | Kata sandi |
|---|---|---|
| Pengguna | `pengguna@eshipmennt.test` | `pengguna12345` |
| Admin | `admin@eshipmennt.test` | `admin12345` |

Resi contoh: `JT110461625999` (milik akun Pengguna demo, kasus KS-0412) dan `JT110461625100` (belum diklaim; daftar akun baru dengan nomor berakhiran `1234` untuk mengklaimnya).

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build dan jalankan produksi |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm run smoke` | Uji end-to-end lewat API (server harus jalan; set `BASE_URL`). Mengklaim `JT110461625100`, jadi jalankan `npm run db:reset` sesudahnya |
| `npm run db:reset` | Hapus database & unggahan lokal (hentikan `npm run dev` dulu) |
| `npm run db:generate` | Buat file migrasi setelah mengubah `src/server/db/schema.ts` |
| `npm run db:migrate` / `npm run db:seed` | Migrasi dan isi data contoh ke `DATABASE_URL` (produksi) |

## Deploy gratis (Vercel + Supabase)

1. **Supabase** (gratis): buat proyek → *Project Settings → Database* → salin connection string mode **Transaction pooler** (port 6543). Buat bucket Storage **privat** bernama `evidence`. Salin `Project URL` dan `service_role key`.
2. Dari komputer, isi database produksi sekali:
   ```bash
   DATABASE_URL="postgresql://..." ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:migrate
   DATABASE_URL="postgresql://..." ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
   ```
3. **Vercel** (Hobby, gratis): impor repo GitHub, lalu isi Environment Variables sesuai `.env.example`: `DATABASE_URL`, `SESSION_SECRET`, `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=evidence`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Opsional: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_API_KEY`, dan `NEXT_PUBLIC_GOOGLE_APP_ID` untuk impor Google Drive.
4. Di GitHub, tambahkan secret `SITE_URL` agar workflow `keep-alive` mencegah Supabase dijeda.

Ganti `ADMIN_PASSWORD` dari nilai default; petunjuk akun demo di halaman Masuk otomatis tersembunyi bila kata sandi admin diganti.

Batasan kuota gratis dan alternatifnya (Neon, Cloudflare) dijelaskan di bagian 10 master plan.
