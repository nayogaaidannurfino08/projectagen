# Prompt Lanjutan (Resume) — Antigravity: aps mobile agen

> Gunakan prompt ini setiap kali proses build terhenti karena limit (token/waktu/kuota), baik di tengah satu fase maupun di antara fase. Tidak perlu ubah isi prompt ini tiap kali — cukup paste ulang persis seperti ini di percakapan baru/lanjutan.

---

## PERAN

Kamu melanjutkan pengerjaan project **"aps mobile agen"** (aplikasi kasir agen sembako, Firebase project `aps-mobile-agen-a0755`) yang sempat terhenti karena limit. Kamu **BUKAN** memulai ulang project.

Acuan yang harus kamu pakai, urutan prioritas:
1. **File `spesifikasi-aps-agen-sembako.md`** — sumber kebenaran struktur data, alur fitur, dan panduan desain. Tidak boleh diubah.
2. **File `prompt-eksekusi-antigravity.md`** — sumber kebenaran urutan Fase 1–9 dan detail tugas tiap fase. Tidak boleh diubah.
3. **Isi folder project saat ini** — kondisi nyata apa yang sudah jadi.

Ketiganya tidak berubah. Rancangan (struktur data, alur fitur, urutan fase, panduan desain) **final dan tidak boleh dirombak**, walau ada cara lain yang menurutmu "lebih baik".

---

## LANGKAH WAJIB SEBELUM MENULIS/MENGUBAH KODE APA PUN

1. **Audit folder project terlebih dahulu.** Telusuri seluruh struktur file yang sudah ada (halaman/screen, service, komponen, konfigurasi Firebase, security rules yang sudah dideploy, dsb). Jangan asumsikan dari histori chat saja — cek isi folder yang sebenarnya, karena bisa jadi progres terakhir tidak sempat tersampaikan sebelum limit.
2. **Petakan progres ke Fase 1–9** di `prompt-eksekusi-antigravity.md`:
   - Fase/bagian mana yang **sudah selesai dan berfungsi** → tandai selesai.
   - Fase/bagian mana yang **sudah ada file/kode tapi belum lengkap/belum jalan** (kemungkinan besar ini titik terhentinya limit) → tandai sedang berjalan.
   - Fase/bagian mana yang **belum ada sama sekali** → tandai belum dimulai.
3. **Tampilkan hasil audit ini ke saya dalam bentuk ringkasan per fase** (Fase 1: selesai / Fase 2: selesai / Fase 3: sebagian — bagian X belum / Fase 4–9: belum dimulai, dst) **sebelum** melanjutkan eksekusi apa pun.

---

## ATURAN KETAT SELAMA MELANJUTKAN

- **DILARANG mengubah, menulis ulang, refactor, "merapikan", atau mengoptimasi kode/file yang sudah selesai dan berfungsi**, walau gaya kodenya berbeda dari yang akan kamu tulis sekarang. Biarkan apa adanya.
- **DILARANG mengubah struktur data Firestore, nama koleksi, nama field, alur fitur, urutan navigasi, atau panduan desain** yang sudah ditetapkan di file spesifikasi — termasuk yang berlaku untuk fase yang belum dikerjakan.
- **DILARANG mengubah urutan fase atau menambah/menghapus fase** dari yang sudah dirancang di `prompt-eksekusi-antigravity.md`.
- Jika bagian yang "sedang berjalan" (belum lengkap) ditemukan saat audit: **lanjutkan/lengkapi bagian yang kurang saja**, jangan tulis ulang dari nol kecuali kode yang ada memang rusak/tidak bisa jalan sama sekali — jika demikian, jelaskan dulu alasannya sebelum menulis ulang, dan tetap ikuti spesifikasi yang sama persis.
- Konsistensikan kode baru dengan pola/konvensi yang sudah dipakai di kode lama (penamaan variabel, struktur folder, cara pemanggilan service Firestore, dsb) — jangan pakai pola baru hanya karena preferensimu.
- Lanjutkan **fase per fase secara berurutan**, mulai dari fase pertama yang belum tuntas hasil audit. Jangan melompat ke fase yang lebih belakangan meski secara teknis bisa, kecuali fase-fase sebelumnya sudah benar-benar tuntas.

---

## SAAT MENGERJAKAN LANJUTAN

1. Sebutkan secara eksplisit di awal: "Melanjutkan dari Fase [X], bagian [Y]" sebelum mulai menulis kode.
2. Selesaikan bagian yang tertunda di fase tersebut sampai tuntas dan bisa diverifikasi jalan.
3. Setelah satu fase benar-benar tuntas, beri ringkasan singkat, lalu lanjut ke fase berikutnya — tetap ikuti urutan di `prompt-eksekusi-antigravity.md`.
4. Jika proses ini terhenti limit lagi di tengah jalan, **prompt ini yang sama bisa dipakai ulang** pada sesi berikutnya — karena langkah pertamanya selalu audit ulang kondisi folder terbaru, bukan mengandalkan ingatan sesi sebelumnya.

---

## JIKA RAGU

Jika saat audit kamu menemukan bagian yang ambigu (misal: kode ada tapi tidak jelas apakah sudah "selesai" atau baru draft awal), **jangan menebak dan langsung menimpa** — laporkan temuannya dan tanyakan konfirmasi dulu sebelum melanjutkan/menulis ulang bagian tersebut.
