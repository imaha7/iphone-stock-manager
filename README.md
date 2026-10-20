# iPhone Stock Manager (Fullstack Next.js + NestJS)

Aplikasi manajemen stok, barang masuk/keluar, transaksi penjualan, dan laporan keuangan toko iPhone.

## 🚀 Fitur Utama

1. **Data Stok iPhone**:
   - Mencatat Model, Kapasitas, Warna, IMEI, Harga Beli, Harga Jual, dan Status Stok (Tersedia / Terjual).
   - Quantity menunjukkan jumlah unit yang masih tersedia; status otomatis menjadi *Terjual* saat quantity mencapai 0.
   - Nilai quantity 0 tetap ditampilkan sebagai 0 dan tidak diganti dengan nilai default.
   - Pencarian berdasarkan Model atau IMEI dan filter status.

2. **Barang Masuk & Keluar**:
   - Pembelian (Barang Masuk): Input unit baru beserta supplier, tanggal masuk, dan catatan.
   - Stok otomatis bertambah dengan status *Tersedia*.
   - Quantity barang masuk dapat diedit meskipun stok saat ini sudah habis; stok tersedia dihitung dari total pembelian dikurangi jumlah yang sudah terjual.
   - Penjualan (Barang Keluar): Pilih stok yang tersedia, masukkan quantity yang dijual, harga jual, data pembeli, serta biaya tambahan.
   - Quantity stok berkurang sesuai penjualan dan status otomatis menjadi *Terjual* saat habis.

3. **Transaksi Penjualan Sederhana**:
   - Modal input interaktif: Cukup pilih unit iPhone yang tersedia di stok, masukkan harga jual dan detail pembeli.
   - Invoice dapat dibuka untuk setiap transaksi dan dicetak atau disimpan sebagai PDF, berisi detail pembeli, transaksi, serta unit iPhone yang dijual.

4. **Profit per Unit**:
   - Otomatis menghitung laba kotor per unit (Harga Jual - Harga Beli) dan laba bersih per unit (setelah dipotong biaya tambahan).

5. **Laba Bersih & Biaya Tambahan**:
   - Mendukung pencatatan biaya tambahan di setiap penjualan (misal: Ongkos Kirim, Servis ganti baterai/LCD, biaya operasional packing/bonus).
   - Menghitung laba bersih riil.

6. **Ringkasan & Dashboard Finansial**:
   - Total Stok unit yang tersedia.
   - Total Pembelian (nominal & frekuensi transaksi).
   - Total Penjualan & Omzet.
   - Laba Kotor & Laba Bersih keseluruhan.
   - Filter berdasarkan periode tanggal.
   - Daftar transaksi pembelian & penjualan terbaru.

7. **Authentication**:
   - Register dan login dengan password minimal 12 karakter.
   - Password disimpan menggunakan scrypt; sesi menggunakan JWT di cookie HttpOnly.
   - Semua endpoint API memerlukan sesi login, kecuali register dan login.
   - Nama profil dapat dilihat di navigasi dan diperbarui setelah login.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: NestJS 10, TypeScript, Prisma ORM, class-validator
- **Database**: SQLite (`dev.db` via Prisma)

---

## 💻 Cara Menjalankan

### Opsi 1: Menjalankan Langsung dengan Script
Jalankan file batch:
```bash
# Di root folder iphone-stock-manager
start-all.bat
```
Jika `JWT_SECRET` belum ditetapkan di environment, script membuat secret acak sementara untuk sesi tersebut. Tetapkan `JWT_SECRET` permanen agar sesi tetap berlaku setelah aplikasi dimulai ulang.

### Opsi 2: Menjalankan Secara Manual

#### 1. Jalankan Backend (NestJS - Port 3000)
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts   # (Opsional) untuk mengisi data awal contoh
# Buat secret dengan `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
# lalu atur nilainya di PowerShell; gunakan kembali nilai yang sama setiap backend dijalankan.
$env:JWT_SECRET = '<secret-acak-minimal-32-byte-yang-disimpan-aman>'
npm run start:dev
```
Backend berjalan di: `http://localhost:3000` (API di `http://localhost:3000/api`)
`JWT_SECRET` wajib diatur untuk menjalankan backend dan harus memiliki minimal 32 byte. Simpan secret konfigurasi ini dengan aman dan gunakan nilai yang sama saat backend dimulai kembali.

#### 2. Jalankan Frontend (Next.js - Port 3001)
```bash
cd frontend
npm install
npm run dev
```
Buka browser di: `http://localhost:3001`
*(Frontend otomatis mem-proxy request `/api/*` ke backend NestJS di port 3000)*
Buat akun melalui halaman **Register** atau login melalui halaman **Login**.
