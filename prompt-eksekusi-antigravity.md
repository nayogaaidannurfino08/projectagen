# Prompt Eksekusi — Antigravity: Aplikasi Kasir Agen Sembako

> Cara pakai: paste seluruh isi di bawah ini ke Antigravity sebagai prompt awal, lalu lampirkan/rujuk file `spesifikasi-aps-agen-sembako.md` sebagai dokumen acuan detail. Jika Antigravity membatasi panjang prompt, jalankan per **FASE** secara berurutan (Fase 1 dulu sampai selesai, baru lanjut Fase 2, dst).

---

## PERAN & KONTEKS

Kamu adalah AI developer yang akan membangun aplikasi kasir (POS) untuk agen sembako UMKM bernama **"aps mobile agen"**, mobile & web responsif, dengan backend Firebase (Firestore + Authentication), paket Spark (gratis).

**Firebase Project yang sudah dibuat:** `aps-mobile-agen-a0755` — gunakan project ini, jangan buat project baru.

Ikuti spesifikasi lengkap di file `spesifikasi-aps-agen-sembako.md` sebagai sumber kebenaran utama untuk struktur data, alur fitur, dan panduan desain. Jika ada instruksi di prompt ini yang bertentangan dengan file spesifikasi, **file spesifikasi yang menang**.

**Batasan penting (karena Spark plan/gratis):**
- Tidak ada Cloud Functions → semua logika (update stok, update totalHutang, dsb) dilakukan di sisi client memakai Firestore **batch write** atau **transaction**, bukan Cloud Function trigger.
- Tidak ada backend server custom di luar Firebase SDK langsung dari client.
- Jangan tambahkan dependency berbayar/paket premium apa pun.

Bangun secara bertahap per fase di bawah. **Setelah setiap fase selesai, jalankan/verifikasi dulu sebelum lanjut ke fase berikutnya** — jangan loncat fase.

---

## FASE 1 — Setup Project & Koneksi Firebase

1. Inisialisasi project (pilih struktur yang paling sesuai dengan platform yang didukung Antigravity — web responsif sebagai prioritas, mobile-wrapper menyusul jika didukung).
2. Install & konfigurasi Firebase SDK, hubungkan ke project `aps-mobile-agen-a0755` (Firestore + Authentication, metode login **email/password**).
3. Aktifkan **Firestore offline persistence** di awal inisialisasi app (wajib, agar tetap bisa dipakai saat sinyal lemah — ini krusial untuk lokasi agen sembako).
4. Buat struktur folder rapi: `pages`/`screens`, `components`, `services` (untuk fungsi akses Firestore), `hooks`/`state`, `styles`.
5. Buat file service terpisah per koleksi Firestore (`services/produkService`, `services/transaksiService`, `services/pelangganService`, `services/hutangService`, `services/userService`, `services/stokLogService`) — semua operasi baca/tulis Firestore lewat service ini, jangan panggil Firestore langsung dari komponen UI.
6. Setup routing/navigasi dasar sesuai struktur halaman di bagian 4 file spesifikasi (Login → Dashboard → Kasir/Stok/Bon/Laporan/Kelola Pengguna).

**Output yang diharapkan di akhir Fase 1:** app bisa dijalankan, konek ke Firebase, routing kosong (halaman placeholder) sudah ada sesuai struktur navigasi.

---

## FASE 2 — Autentikasi & Role (admin/kasir)

1. Buat halaman **Login** (email + password) memakai Firebase Authentication.
2. Setelah login sukses, ambil dokumen user dari koleksi `users` (field `role`, `agenId`, `nama`) dan simpan di state/context global aplikasi agar bisa diakses di semua halaman.
3. Implementasikan **route guard**: halaman "Kelola Pengguna" hanya bisa diakses role `admin`. Kasir yang mencoba akses langsung diarahkan balik ke Dashboard.
4. Terapkan **Firebase Security Rules** persis sesuai bagian 3 file spesifikasi (termasuk pembatasan akses `pelanggan` & `hutang` untuk kasir vs admin, dan pembatasan `agenId`). Deploy rules ini ke Firebase Console/CLI.
5. Sediakan 1 akun admin awal (seed manual via Firebase Console atau script sekali jalan) supaya bisa langsung testing login.

**Output yang diharapkan:** login berfungsi, role admin/kasir membedakan akses menu, security rules sudah aktif (bukan mode test/terbuka).

---

## FASE 3 — Kasir (POS) — Fitur Inti

Bangun halaman Kasir sesuai bagian 5.1 file spesifikasi, urutan implementasi:

1. Grid produk dengan filter kategori (tab) + kolom pencarian nama produk.
2. Tap produk → masuk keranjang qty 1, tombol +/- untuk ubah qty, validasi qty tidak melebihi stok tersedia (tampilkan peringatan halus).
3. Panel ringkasan (daftar item, subtotal, total) — di layout landscape tampil sebagai panel kanan.
4. **Auto-rotate ke landscape** saat halaman Kasir dibuka (Screen Orientation API di web / native orientation lock di app), kembali ke portrait saat keluar halaman.
5. Tombol "Bayar" dengan 3 metode:
   - **QRIS**: tampilkan total + gambar kode QR statis, tanpa input nominal, tombol "Selesai" langsung aktif.
   - **Cash**: input "Uang Diterima" + tombol pintas nominal umum (20rb/50rb/100rb/"Uang Pas"), hitung otomatis "Kembalian", tombol "Selesai" nonaktif jika kurang.
   - **Bon/Hutang**: pilih pelanggan dari daftar (search) atau tambah pelanggan baru inline, tombol "Selesai" nonaktif sampai pelanggan dipilih.
6. Saat checkout sukses, jalankan sebagai **satu Firestore transaction/batch**:
   - Kurangi stok tiap produk sesuai qty terjual.
   - Insert dokumen baru ke `transaksi`.
   - Insert dokumen ke `stokLog` (alasan `terjual`) per produk.
   - Jika metode `bon`: insert dokumen ke `hutang` (tipe `bon_baru`) dan update `totalHutang` di dokumen `pelanggan` terkait.
7. Tampilkan struk ringkas di layar setelah transaksi selesai (untuk difoto/screenshot kasir).

**Output yang diharapkan:** transaksi kasir end-to-end berhasil untuk ketiga metode bayar, stok ter-update otomatis, data konsisten walau salah satu bagian gagal (pakai transaction, bukan multiple write terpisah).

---

## FASE 4 — Kelola Stok/Produk

Sesuai bagian 5.3 file spesifikasi:

1. Daftar produk: tabel di layout laptop, list card di mobile, dengan pencarian & filter kategori.
2. Form tambah produk (nama, kategori, harga jual, harga modal, stok awal, satuan).
3. Edit produk & update stok manual → setiap perubahan otomatis tercatat ke `stokLog` dengan alasan (`restock`/`koreksi`).
4. Field opsional "satuan konversi" (misal 1 dus = 12 pcs) — saat restock per dus, stok pcs ikut ter-update otomatis.
5. Field opsional kode barcode + tombol scan barcode via kamera untuk mempercepat pencarian saat kasir/restock.
6. Field "stok minimum" per produk + indikator visual (perubahan warna teks, tanpa animasi) saat stok di bawah ambang batas.

---

## FASE 5 — Hutang/Bon Pelanggan

Sesuai bagian 5.4 file spesifikasi:

1. Daftar pelanggan + `totalHutang` masing-masing, urut dari terbesar, dengan pencarian by nama/no HP.
2. Form tambah pelanggan baru (nama, no HP opsional, alamat opsional).
3. Halaman detail per pelanggan: riwayat hutang & cicilan (tanggal, jumlah, catatan), total berjalan.
4. Tombol "Catat Pembayaran/Cicilan": input nominal → kurangi `totalHutang`, insert dokumen `hutang` tipe `cicilan`. Jika hutang lunas, tandai status lunas tanpa menghapus riwayat.
5. Tombol share pengingat hutang via WhatsApp (pakai share intent/link `wa.me`, isi teks otomatis berisi nama + nominal hutang) — bukan integrasi API WhatsApp berbayar.

---

## FASE 6 — Dashboard

Sesuai bagian 5.2 file spesifikasi:

1. Kartu ringkasan hari ini: Total Penjualan, Jumlah Transaksi, Produk Terlaris (hitung dari koleksi `transaksi` hari berjalan).
2. Kartu **Total Hutang Beredar** (akumulasi `totalHutang` semua pelanggan), beri warna aksen berbeda.
3. Grafik kecil traffic penjualan 7 hari terakhir (preview, chart sederhana).
4. Pintasan tombol ke Kasir, Stok, Bon, Laporan.

---

## FASE 7 — Laporan & Traffic Penjualan

Sesuai bagian 5.5 file spesifikasi:

1. Grafik garis/batang traffic penjualan realtime dari Firestore, dengan filter rentang tanggal (hari ini/7 hari/30 hari/custom).
2. Tabel riwayat transaksi + detail item per transaksi, dengan filter tambahan by metode bayar (qris/cash/bon).
3. Ringkasan laba kotor (total penjualan − total modal produk terjual) per periode yang difilter.
4. Laporan hutang: total hutang beredar per periode, daftar pelanggan berhutang, riwayat pelunasan.

---

## FASE 8 — Kelola Pengguna (khusus admin)

Sesuai bagian 5.6 file spesifikasi:

1. Tambah akun kasir baru (buat user di Firebase Auth + dokumen di koleksi `users`).
2. Nonaktifkan akun kasir (disable di Auth, jangan hapus datanya).
3. Atur/ubah role (admin/kasir).
4. Reset password akun kasir via Firebase Auth.

---

## FASE 9 — Desain, Responsivitas & Polish Akhir

Terapkan panduan desain di bagian 6 file spesifikasi secara konsisten ke seluruh halaman yang sudah dibangun:

1. 1 warna utama modern (biru tua atau hijau tosca) + 1 warna aksen, latar netral.
2. Ikon secukupnya, tanpa ikon dekoratif yang tidak fungsional.
3. Animasi/transisi minimal — hindari parallax/efek 3D agar app tetap ringan.
4. 1–2 jenis font, ukuran cukup besar agar mudah dibaca kasir saat sibuk.
5. Cek ulang breakpoint responsif: mobile (1 kolom + bottom nav), tablet/landscape mode kasir (2 panel), laptop (sidebar + tabel lengkap).
6. Review menyeluruh: pastikan semua state loading, error, dan kosong (empty state) sudah ditangani di tiap halaman (produk kosong, hutang kosong, transaksi kosong, dll).

---

## URUTAN EKSEKUSI

Kerjakan **Fase 1 → 9 secara berurutan**, jangan lompat. Setiap selesai satu fase:
- Ringkas apa yang sudah dibuat.
- Sebutkan jika ada bagian dari file spesifikasi yang terpaksa disesuaikan/di-skip karena keterbatasan platform Antigravity, beserta alasannya.
- Tunggu konfirmasi sebelum lanjut ke fase berikutnya (kecuali diminta jalan otomatis sampai selesai).

Jika di tengah proses ada ambiguitas yang tidak tercakup di file spesifikasi, ambil keputusan paling sederhana dan konsisten dengan pola yang sudah ada, lalu catat asumsi yang diambil.
