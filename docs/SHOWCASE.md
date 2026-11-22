# Data peraga (showcase)

Dibuat oleh `npm run db:showcase` (lokal) atau `npm run db:showcase:prod` (produksi). Menjalankannya lagi mengembalikan semua data peraga ke keadaan awal; data lain tidak disentuh.

Semua kasus peraga ditangani **satu akun admin** (`ADMIN_EMAIL`). Password semua akun peraga: `showcase2026`.

## Akun pengguna

| Email | Telepon (4 digit akhir) | Kasus | Keadaan |
|---|---|---|---|
| `demo.tidakbisa@eshipmennt.test` | 081100001101 (`1101`) | – | Tidak bisa melapor: paket belum diklaim / milik akun lain |
| `demo.baru@eshipmennt.test` | 081100002202 (`2202`) | KS-0413 | Laporan terkirim, menunggu ditinjau admin (Baru) |
| `demo.diproses@eshipmennt.test` | 081100003303 (`3303`) | KS-0414 | Laporan sedang diselidiki admin (Diproses) |
| `demo.penyebab@eshipmennt.test` | 081100004404 (`4404`) | KS-0415 | Penyebab ditemukan, menunggu keputusan dikirim |
| `demo.selesai@eshipmennt.test` | 081100005505 (`5505`) | KS-0416 | Kasus selesai dan ditutup |
| `demo.pelapor@eshipmennt.test` | 081100006606 (`6606`) | – | Pemilik paket peraga massal, siap dilaporkan (lihat docs/SHOWCASE.md) |

## Paket skenario

| Resi | Untuk peraga | Pemilik | 4 digit telepon penerima |
|---|---|---|---|
| `JT990000000101` | Belum diklaim: klaim dulu sebelum bisa melapor | tanpa pemilik | `1101` |
| `JT990000000102` | Milik akun lain: tidak bisa diklaim/dilaporkan akun lain | demo.baru | `2202` |
| `JT990000000202` | Kasus Baru | demo.baru | `2202` |
| `JT990000000303` | Kasus Diproses | demo.diproses | `3303` |
| `JT990000000404` | Kasus Penyebab ditemukan | demo.penyebab | `4404` |
| `JT990000000505` | Kasus Selesai | demo.selesai | `5505` |

Peraga "tidak bisa melapor" (masuk sebagai `demo.tidakbisa`): buka `/lapor/JT990000000102` (sudah milik akun lain, ditolak) dan `/lapor/JT990000000101` (harus diklaim dulu dengan 4 digit `1101`).

## 100 paket peraga

Semua resi bisa dilacak siapa saja di `/lacak/<resi>`. Paket **milik pelapor** sudah dimiliki `demo.pelapor@eshipmennt.test` dan bisa langsung dilaporkan lewat `/lapor/<resi>`. Paket **tanpa pemilik** bisa diklaim akun mana pun (Pengguna) memakai 4 digit telepon penerima di tabel.

| Status | Jumlah | Milik pelapor | Tanpa pemilik |
|---|---|---|---|
| Diterima (OTP) | 60 | 52 | 8 |
| Diterima tanpa bukti serah terima | 8 | 7 | 1 |
| Dalam pengantaran | 7 | 5 | 2 |
| Dalam perjalanan | 7 | 5 | 2 |
| Dalam perjalanan · identitas tidak cocok | 7 | 5 | 2 |
| Dalam perjalanan · macet di hub | 5 | 2 | 3 |
| Diambil kurir | 6 | 4 | 2 |
| **Total** | **100** | **80** | **20** |

### Diterima (OTP) (60)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000001` | Bogor → Balikpapan | Rp400.000 | demo.pelapor | `6606` |
| `JT990100000002` | Semarang → Bandung | Rp370.000 | demo.pelapor | `6606` |
| `JT990100000003` | Palembang → Yogyakarta | Rp1.810.000 | tanpa pemilik (Budi Santoso) | `3160` |
| `JT990100000004` | Jakarta Barat → Bekasi | Rp1.175.000 | demo.pelapor | `6606` |
| `JT990100000005` | Surabaya → Palembang | Rp1.550.000 | demo.pelapor | `6606` |
| `JT990100000006` | Jakarta Barat → Palembang | Rp900.000 | demo.pelapor | `6606` |
| `JT990100000007` | Solo → Jakarta Selatan | Rp2.045.000 | demo.pelapor | `6606` |
| `JT990100000008` | Jakarta Selatan → Bekasi | Rp1.830.000 | demo.pelapor | `6606` |
| `JT990100000009` | Tangerang → Denpasar | Rp855.000 | demo.pelapor | `6606` |
| `JT990100000010` | Malang → Cirebon | Rp2.365.000 | demo.pelapor | `6606` |
| `JT990100000011` | Bekasi → Depok | Rp1.575.000 | demo.pelapor | `6606` |
| `JT990100000012` | Surabaya → Balikpapan | Rp1.555.000 | demo.pelapor | `6606` |
| `JT990100000013` | Jakarta Barat → Depok | Rp2.005.000 | demo.pelapor | `6606` |
| `JT990100000014` | Tangerang → Denpasar | Rp835.000 | demo.pelapor | `6606` |
| `JT990100000015` | Bogor → Jakarta Selatan | Rp2.270.000 | demo.pelapor | `6606` |
| `JT990100000016` | Balikpapan → Cirebon | Rp650.000 | demo.pelapor | `6606` |
| `JT990100000017` | Jakarta Barat → Cirebon | Rp1.135.000 | demo.pelapor | `6606` |
| `JT990100000018` | Solo → Makassar | Rp830.000 | demo.pelapor | `6606` |
| `JT990100000019` | Tangerang → Bandung | Rp2.160.000 | demo.pelapor | `6606` |
| `JT990100000020` | Jakarta Timur → Balikpapan | Rp1.330.000 | demo.pelapor | `6606` |
| `JT990100000021` | Balikpapan → Malang | Rp2.300.000 | demo.pelapor | `6606` |
| `JT990100000022` | Balikpapan → Jakarta Barat | Rp1.740.000 | demo.pelapor | `6606` |
| `JT990100000023` | Bekasi → Cirebon | Rp2.350.000 | demo.pelapor | `6606` |
| `JT990100000024` | Medan → Pontianak | Rp115.000 | tanpa pemilik (Made Rahayu) | `5658` |
| `JT990100000025` | Tangerang → Semarang | Rp2.460.000 | demo.pelapor | `6606` |
| `JT990100000026` | Makassar → Jakarta Barat | Rp405.000 | demo.pelapor | `6606` |
| `JT990100000027` | Denpasar → Malang | Rp2.285.000 | demo.pelapor | `6606` |
| `JT990100000028` | Jakarta Selatan → Surabaya | Rp285.000 | demo.pelapor | `6606` |
| `JT990100000029` | Jakarta Timur → Makassar | Rp535.000 | demo.pelapor | `6606` |
| `JT990100000030` | Semarang → Makassar | Rp1.430.000 | tanpa pemilik (Sari Santoso) | `8885` |
| `JT990100000031` | Palembang → Denpasar | Rp2.120.000 | demo.pelapor | `6606` |
| `JT990100000032` | Bandung → Denpasar | Rp90.000 | demo.pelapor | `6606` |
| `JT990100000033` | Yogyakarta → Jakarta Barat | Rp2.220.000 | demo.pelapor | `6606` |
| `JT990100000034` | Jakarta Selatan → Tangerang | Rp1.565.000 | demo.pelapor | `6606` |
| `JT990100000035` | Bandung → Solo | Rp750.000 | demo.pelapor | `6606` |
| `JT990100000036` | Denpasar → Palembang | Rp2.210.000 | demo.pelapor | `6606` |
| `JT990100000037` | Pontianak → Cirebon | Rp1.275.000 | demo.pelapor | `6606` |
| `JT990100000038` | Jakarta Selatan → Medan | Rp695.000 | demo.pelapor | `6606` |
| `JT990100000039` | Surabaya → Semarang | Rp990.000 | demo.pelapor | `6606` |
| `JT990100000040` | Solo → Jakarta Barat | Rp2.130.000 | demo.pelapor | `6606` |
| `JT990100000041` | Balikpapan → Jakarta Barat | Rp705.000 | tanpa pemilik (Sari Permata) | `9515` |
| `JT990100000042` | Bogor → Pontianak | Rp1.850.000 | demo.pelapor | `6606` |
| `JT990100000043` | Bekasi → Surabaya | Rp390.000 | demo.pelapor | `6606` |
| `JT990100000044` | Bekasi → Solo | Rp2.360.000 | tanpa pemilik (Wulan Pratama) | `7594` |
| `JT990100000045` | Makassar → Jakarta Selatan | Rp1.425.000 | demo.pelapor | `6606` |
| `JT990100000046` | Bekasi → Denpasar | Rp1.130.000 | demo.pelapor | `6606` |
| `JT990100000047` | Yogyakarta → Denpasar | Rp2.490.000 | demo.pelapor | `6606` |
| `JT990100000048` | Jakarta Timur → Jakarta Barat | Rp535.000 | tanpa pemilik (Rizky Lestari) | `5975` |
| `JT990100000049` | Surabaya → Bekasi | Rp760.000 | demo.pelapor | `6606` |
| `JT990100000050` | Makassar → Jakarta Selatan | Rp1.290.000 | tanpa pemilik (Hendra Lestari) | `3619` |
| `JT990100000051` | Semarang → Solo | Rp445.000 | demo.pelapor | `6606` |
| `JT990100000052` | Tangerang → Palembang | Rp1.720.000 | tanpa pemilik (Yoga Pratama) | `2047` |
| `JT990100000053` | Balikpapan → Semarang | Rp200.000 | demo.pelapor | `6606` |
| `JT990100000054` | Medan → Denpasar | Rp1.520.000 | demo.pelapor | `6606` |
| `JT990100000055` | Bekasi → Denpasar | Rp1.930.000 | demo.pelapor | `6606` |
| `JT990100000056` | Semarang → Yogyakarta | Rp680.000 | demo.pelapor | `6606` |
| `JT990100000057` | Pontianak → Balikpapan | Rp355.000 | demo.pelapor | `6606` |
| `JT990100000058` | Semarang → Solo | Rp890.000 | demo.pelapor | `6606` |
| `JT990100000059` | Solo → Jakarta Barat | Rp2.235.000 | demo.pelapor | `6606` |
| `JT990100000060` | Bogor → Denpasar | Rp225.000 | demo.pelapor | `6606` |

### Diterima tanpa bukti serah terima (8)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000061` | Jakarta Timur → Bogor | Rp1.075.000 | demo.pelapor | `6606` |
| `JT990100000062` | Semarang → Medan | Rp1.350.000 | demo.pelapor | `6606` |
| `JT990100000063` | Medan → Palembang | Rp1.935.000 | demo.pelapor | `6606` |
| `JT990100000064` | Medan → Jakarta Timur | Rp1.205.000 | demo.pelapor | `6606` |
| `JT990100000065` | Cirebon → Denpasar | Rp645.000 | demo.pelapor | `6606` |
| `JT990100000066` | Medan → Denpasar | Rp475.000 | tanpa pemilik (Hendra Kusuma) | `4336` |
| `JT990100000067` | Medan → Bogor | Rp2.335.000 | demo.pelapor | `6606` |
| `JT990100000068` | Cirebon → Jakarta Timur | Rp1.225.000 | demo.pelapor | `6606` |

### Dalam pengantaran (7)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000069` | Malang → Depok | Rp2.375.000 | tanpa pemilik (Made Pratama) | `3007` |
| `JT990100000070` | Jakarta Timur → Solo | Rp1.955.000 | demo.pelapor | `6606` |
| `JT990100000071` | Solo → Jakarta Selatan | Rp460.000 | demo.pelapor | `6606` |
| `JT990100000072` | Bekasi → Palembang | Rp260.000 | demo.pelapor | `6606` |
| `JT990100000073` | Surabaya → Denpasar | Rp940.000 | demo.pelapor | `6606` |
| `JT990100000074` | Bogor → Surabaya | Rp575.000 | demo.pelapor | `6606` |
| `JT990100000075` | Yogyakarta → Tangerang | Rp1.145.000 | tanpa pemilik (Hendra Rahayu) | `4250` |

### Dalam perjalanan (7)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000076` | Jakarta Barat → Makassar | Rp2.315.000 | demo.pelapor | `6606` |
| `JT990100000077` | Yogyakarta → Jakarta Barat | Rp1.870.000 | demo.pelapor | `6606` |
| `JT990100000078` | Makassar → Malang | Rp445.000 | tanpa pemilik (Budi Kusuma) | `1871` |
| `JT990100000079` | Bekasi → Bandung | Rp1.050.000 | demo.pelapor | `6606` |
| `JT990100000080` | Jakarta Selatan → Yogyakarta | Rp2.115.000 | tanpa pemilik (Made Rahayu) | `3699` |
| `JT990100000081` | Depok → Jakarta Barat | Rp1.820.000 | demo.pelapor | `6606` |
| `JT990100000082` | Tangerang → Medan | Rp1.020.000 | demo.pelapor | `6606` |

### Dalam perjalanan · identitas tidak cocok (7)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000083` | Yogyakarta → Jakarta Timur | Rp1.625.000 | tanpa pemilik (Gita Santoso) | `3972` |
| `JT990100000084` | Palembang → Cirebon | Rp975.000 | demo.pelapor | `6606` |
| `JT990100000085` | Tangerang → Jakarta Barat | Rp385.000 | demo.pelapor | `6606` |
| `JT990100000086` | Pontianak → Depok | Rp1.670.000 | demo.pelapor | `6606` |
| `JT990100000087` | Bogor → Makassar | Rp2.225.000 | demo.pelapor | `6606` |
| `JT990100000088` | Malang → Balikpapan | Rp1.595.000 | demo.pelapor | `6606` |
| `JT990100000089` | Semarang → Bekasi | Rp900.000 | tanpa pemilik (Tono Wijaya) | `1795` |

### Dalam perjalanan · macet di hub (5)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000090` | Makassar → Balikpapan | Rp365.000 | tanpa pemilik (Ayu Nugroho) | `6646` |
| `JT990100000091` | Makassar → Depok | Rp1.580.000 | tanpa pemilik (Lestari Santoso) | `2945` |
| `JT990100000092` | Tangerang → Jakarta Selatan | Rp300.000 | demo.pelapor | `6606` |
| `JT990100000093` | Medan → Makassar | Rp1.855.000 | tanpa pemilik (Oki Saputra) | `9541` |
| `JT990100000094` | Denpasar → Yogyakarta | Rp2.240.000 | demo.pelapor | `6606` |

### Diambil kurir (6)

| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |
|---|---|---|---|---|
| `JT990100000095` | Solo → Jakarta Timur | Rp530.000 | demo.pelapor | `6606` |
| `JT990100000096` | Bekasi → Malang | Rp2.220.000 | demo.pelapor | `6606` |
| `JT990100000097` | Malang → Pontianak | Rp685.000 | tanpa pemilik (Fajar Kusuma) | `1276` |
| `JT990100000098` | Semarang → Bogor | Rp1.145.000 | demo.pelapor | `6606` |
| `JT990100000099` | Tangerang → Jakarta Timur | Rp1.610.000 | demo.pelapor | `6606` |
| `JT990100000100` | Tangerang → Balikpapan | Rp2.360.000 | tanpa pemilik (Citra Pratama) | `4956` |
