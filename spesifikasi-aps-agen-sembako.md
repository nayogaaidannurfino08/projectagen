# Spesifikasi Aplikasi Kasir Agen Sembako (aps mobile agen)

## 1. Ringkasan Project

Aplikasi mobile & web responsif untuk agen UMKM (fokus: agen sembako) yang mencakup kasir (POS), manajemen stok, dashboard, dan laporan penjualan. Dibangun menggunakan Antigravity dengan backend **Firebase** (Firestore + Authentication), paket Spark (gratis).

**Firebase Project:** `aps-mobile-agen-a0755`

---

## 2. Struktur Data (Firestore)

Struktur koleksi disiapkan dengan field `agenId` di tiap dokumen transaksi/produk, supaya di masa depan bisa dikembangkan jadi multi-agen tanpa merombak skema — meski saat ini cukup dipakai untuk 1 agen.

### Koleksi: `users`
| Field | Tipe | Keterangan |
|---|---|---|
| uid | string | ID dari Firebase Auth |
| nama | string | Nama pengguna |
| role | string | `admin` atau `kasir` |
| agenId | string | ID agen (default: 1 nilai tetap untuk saat ini) |

### Koleksi: `produk`
| Field | Tipe | Keterangan |
|---|---|---|
| id | string (auto) | ID dokumen |
| nama | string | Nama produk |
| kategori | string | Misal: Sembako, Minuman, Rokok |
| hargaJual | number | Harga jual per unit |
| hargaModal | number | Harga modal (untuk hitung laba) |
| stok | number | Jumlah stok saat ini |
| satuan | string | Misal: pcs, kg, dus |
| agenId | string | Referensi agen |

### Koleksi: `transaksi`
| Field | Tipe | Keterangan |
|---|---|---|
| id | string (auto) | ID dokumen |
| tanggal | timestamp | Waktu transaksi |
| items | array of object | `{produkId, nama, qty, hargaSatuan, subtotal}` |
| totalBelanja | number | Total semua item |
| metodeBayar | string | `qris`, `cash`, atau `bon` |
| uangDiterima | number \| null | Hanya diisi jika `cash` |
| kembalian | number \| null | Hanya dihitung jika `cash` |
| pelangganId | string \| null | Hanya diisi jika `metodeBayar = bon`, referensi ke `pelanggan` |
| kasirId | string | Referensi ke `users` |
| agenId | string | Referensi agen |

### Koleksi: `stokLog` (opsional, untuk riwayat perubahan stok)
| Field | Tipe | Keterangan |
|---|---|---|
| produkId | string | Referensi produk |
| perubahan | number | + atau - jumlah |
| alasan | string | `restock`, `terjual`, `koreksi` |
| tanggal | timestamp | Waktu perubahan |

### Koleksi: `pelanggan` (untuk fitur hutang/bon)
| Field | Tipe | Keterangan |
|---|---|---|
| id | string (auto) | ID dokumen |
| nama | string | Nama pelanggan |
| noHp | string \| null | Nomor HP (opsional, untuk kirim reminder WA) |
| alamat | string \| null | Alamat singkat (opsional) |
| totalHutang | number | Akumulasi hutang berjalan (denormalisasi, di-update tiap transaksi bon/pembayaran) |
| agenId | string | Referensi agen |

### Koleksi: `hutang`
| Field | Tipe | Keterangan |
|---|---|---|
| id | string (auto) | ID dokumen |
| pelangganId | string | Referensi ke `pelanggan` |
| transaksiId | string \| null | Referensi transaksi asal (jika hutang berasal dari transaksi kasir) |
| jumlah | number | Nominal hutang (+) atau pembayaran cicilan (−) |
| tipe | string | `bon_baru`, `cicilan`, `lunas` |
| tanggal | timestamp | Waktu pencatatan |
| catatan | string \| null | Keterangan bebas (misal "bayar sebagian") |
| dicatatOleh | string | Referensi ke `users` (kasir/admin yang input) |
| agenId | string | Referensi agen |

> Field `totalHutang` di `pelanggan` di-update lewat Cloud Function trigger (atau dihitung ulang manual di sisi client saat Spark plan belum pakai Cloud Functions) setiap ada dokumen baru di `hutang`.

---

## 3. Aturan Akses (Firebase Security Rules — ringkasan)

- Hanya user yang login (`request.auth != null`) yang bisa membaca/menulis data
- Role `kasir` hanya boleh: buat transaksi baru, baca daftar produk, update stok (otomatis saat transaksi), baca/tambah data `pelanggan` & `hutang` (untuk mencatat bon baru dan cicilan)
- Role `admin` boleh: kelola produk, lihat semua laporan, kelola user, hapus/koreksi data `hutang` dan `pelanggan`
- Semua akses dibatasi ke `agenId` milik user yang login (mencegah data bocor lintas agen jika nanti multi-agen)

---

## 4. Struktur Halaman & Navigasi

```
Login
 └── Dashboard (halaman utama setelah login)
      ├── Kasir (POS)
      ├── Kelola Stok/Produk
      ├── Hutang/Bon Pelanggan
      ├── Laporan & Traffic Penjualan
      └── Kelola Pengguna (khusus admin)
```

**Navigasi:**
- Mobile: bottom navigation bar (5 ikon: Dashboard, Kasir, Stok, Bon, Laporan) — ikon minimal, tanpa animasi berlebihan. Jika dianggap terlalu padat di layar kecil, "Laporan" bisa dipindah ke menu "More"/ikon titik tiga agar bottom nav tetap 4 ikon utama
- Laptop/Desktop: sidebar kiri tetap terlihat dengan label teks + ikon

---

## 5. Spesifikasi Fitur

### 5.1 Kasir (POS)
- Tampilan grid produk (nama, harga, kategori sebagai filter/tab)
- Kolom pencarian cepat di atas grid (cari produk by nama, berguna kalau daftar produk sudah panjang)
- Tap produk → otomatis masuk keranjang dengan qty 1, muncul tombol +/- untuk ubah jumlah
- Validasi qty: tidak bisa melebihi stok tersedia (tampilkan peringatan halus jika qty di keranjang ≥ stok)
- Saat halaman Kasir dibuka: **layar otomatis rotate ke landscape** (pakai Screen Orientation API di web, atau native orientation lock di app)
- Saat keluar dari halaman Kasir: kembali ke portrait
- Panel kanan (landscape) selalu menampilkan ringkasan: daftar item, subtotal, total
- Tombol "Bayar" membuka pilihan metode:
  - **QRIS**: tampilkan info total saja (kode QR statis/gambar), **tanpa kolom input nominal** → tombol "Selesai" langsung setelah konfirmasi
  - **Cash**: muncul kolom input "Uang Diterima" → sistem otomatis hitung dan tampilkan "Kembalian" = uang diterima − total belanja. Validasi: tombol "Selesai" nonaktif jika uang diterima < total belanja. Sediakan tombol pintas nominal umum (misal 20rb, 50rb, 100rb, "Uang Pas") agar kasir tidak perlu ketik manual
  - **Bon/Hutang**: pilih pelanggan dari daftar (atau tambah pelanggan baru inline jika belum ada) → total belanja otomatis tercatat sebagai hutang baru di koleksi `hutang` dan menambah `totalHutang` pelanggan tersebut, tombol "Selesai" nonaktif sampai pelanggan dipilih
- Setelah transaksi selesai: stok produk otomatis berkurang sesuai qty yang terjual, data masuk ke koleksi `transaksi`, opsi tampilkan struk ringkas di layar (untuk difoto/screenshot kasir bila perlu)

### 5.2 Dashboard
- Kartu ringkasan hari ini: Total Penjualan, Jumlah Transaksi, Produk Terlaris
- Kartu Total Hutang Beredar (akumulasi `totalHutang` semua pelanggan) — beri aksen warna berbeda agar mudah dipantau admin
- Grafik kecil traffic penjualan (7 hari terakhir) sebagai preview
- Pintasan ke Kasir, Stok, Bon, dan Laporan

### 5.3 Kelola Stok/Produk
- Daftar produk (tabel di laptop, list card di mobile) dengan pencarian & filter kategori
- Tombol tambah produk baru (nama, kategori, harga jual, harga modal, stok awal, satuan)
- Edit produk & update stok manual (misal saat restock dari supplier), setiap perubahan tercatat otomatis ke `stokLog` dengan alasan yang sesuai
- Field opsional "satuan konversi" (misal 1 dus = 12 pcs) agar saat restock per dus, stok pcs ikut ter-update otomatis — berguna karena agen sembako sering beli grosir per dus/karton tapi jual eceran per pcs
- Field opsional "kode barcode" per produk + tombol scan barcode (pakai kamera device) untuk mempercepat pencarian produk saat kasir maupun saat restock, tanpa mengubah alur tap-grid yang sudah ada
- Indikator visual sederhana untuk stok menipis (misal warna teks berubah, tanpa ikon animasi), dengan ambang batas "stok minimum" yang bisa diatur per produk

### 5.4 Hutang/Bon Pelanggan
- Daftar pelanggan dengan `totalHutang` masing-masing, diurutkan dari hutang terbesar
- Pencarian pelanggan by nama/no HP
- Tambah pelanggan baru (nama, no HP opsional, alamat opsional)
- Detail per pelanggan: riwayat hutang & cicilan (tanggal, jumlah, catatan), total hutang berjalan
- Tombol "Catat Pembayaran/Cicilan" → input nominal cicilan, otomatis mengurangi `totalHutang` dan tercatat sebagai dokumen baru di `hutang` dengan tipe `cicilan`
- Jika cicilan melunasi seluruh hutang, status pelanggan ditandai lunas (tanpa menghapus riwayat)
- Opsi kirim pengingat hutang via WhatsApp (share teks berisi nominal & nama pelanggan ke nomor yang tercatat) — memakai share intent, bukan integrasi API WA berbayar

### 5.5 Laporan & Traffic Penjualan
- Grafik garis/batang traffic penjualan berdasarkan tanggal transaksi (data realtime dari Firestore)
- Filter rentang tanggal (hari ini, 7 hari, 30 hari, custom)
- Tabel riwayat transaksi dengan detail item per transaksi, termasuk filter by metode bayar (qris/cash/bon)
- Ringkasan laba kotor (total penjualan − total modal produk terjual) per periode
- Laporan hutang: total hutang beredar per periode, daftar pelanggan dengan hutang berjalan, dan riwayat pelunasan

### 5.6 Kelola Pengguna (khusus admin)
- Tambah/nonaktifkan akun kasir
- Atur role (admin/kasir)
- Reset password akun kasir (lewat Firebase Auth)

---

## 6. Panduan Desain

- **Warna:** 1 warna utama modern (misal biru tua atau hijau tosca) + 1 warna aksen, latar netral (putih/abu muda)
- **Ikon:** gunakan secukupnya, hindari ikon dekoratif yang tidak fungsional
- **Efek/animasi:** minimal — transisi halaman sederhana, hindari animasi berat (parallax, efek 3D, dsb) agar aplikasi ringan
- **Tipografi:** 1–2 jenis font, ukuran cukup besar untuk kemudahan baca kasir saat sibuk melayani
- **Responsif:**
  - Mobile: 1 kolom, navigasi bawah
  - Tablet/Landscape (mode kasir): 2 panel (produk kiri, ringkasan kanan)
  - Laptop: sidebar + konten lebar, tabel data lengkap ditampilkan

---

## 7. Fitur Tambahan yang Disarankan (opsional, prioritas menyusul)

- Ekspor riwayat transaksi/laporan ke PDF atau Excel
- Kirim struk digital via WhatsApp (share text/gambar)
- Mode offline dengan sinkronisasi otomatis saat online (Firestore offline persistence sudah mendukung ini secara bawaan)
- Notifikasi stok menipis
- Notifikasi/pengingat otomatis untuk hutang yang sudah lama belum dicicil (misal >30 hari)
- Cetak struk fisik via printer thermal Bluetooth (tahap lanjut, setelah fitur inti stabil)
- Backup/export data pelanggan & hutang secara berkala sebagai jaring pengaman (mengingat Spark plan tidak ada backup otomatis bawaan Firebase)

---

## 8. Catatan Implementasi di Antigravity

- Gunakan Firebase SDK (Web atau sesuai platform yang didukung Antigravity) untuk koneksi ke Firestore & Authentication
- Aktifkan **Firestore offline persistence** agar aplikasi tetap bisa dipakai saat sinyal lemah (penting untuk lokasi agen sembako)
- Terapkan Security Rules di Firebase Console sesuai bagian 3 sebelum aplikasi digunakan secara nyata
- Karena Spark plan tidak menyediakan Cloud Functions (butuh Blaze plan), perhitungan `totalHutang` di koleksi `pelanggan` sebaiknya diupdate langsung dari sisi client (transaction/batch write) setiap kali ada dokumen baru di `hutang`, bukan lewat trigger server-side
- Gunakan Firestore **batch write** atau **transaction** saat proses checkout kasir (update stok produk + insert transaksi + insert hutang jika bon) agar data tetap konsisten walau salah satu langkah gagal
