# MikroTik Billing & Monitoring System

Aplikasi berbasis web modern untuk manajemen *Billing* (Tagihan/Pelanggan) sekaligus *Monitoring* Router MikroTik secara langsung. Dibangun menggunakan **Next.js (App Router)**, **Prisma (MySQL)**, dan implementasi **RouterOS API** kustom untuk performa tinggi.

## 🚀 Fitur Utama

### 💰 Billing System (Sistem Tagihan)
*   **Dashboard Keuangan:** Pantau total pelanggan aktif dan pendapatan bulanan.
*   **Manajemen Pelanggan (Customers):** Data pelanggan terpusat.
*   **Paket Layanan (Packages):** Buat berbagai paket kecepatan & harga.
*   **Invoicing & Pembayaran:** Catat tagihan otomatis dan riwayat pembayaran pelanggan.

### 📊 System Monitoring (Pemantauan Router)
*   **Realtime Traffic Chart:** Grafik *bandwidth* jaringan (RX/TX) secara aktual, di-update otomatis setiap 3 detik.
*   **System Overview:** Informasi beban CPU, RAM, Storage, Uptime, dan model arsitektur *board* MikroTik.
*   **Background Daemon:** Pengambilan metrik router dilakukan oleh *daemon* di belakang layar agar tidak membebani router meskipun diakses banyak user bersamaan.

### 🌐 Network Management (Manajemen Jaringan)
*   **PPPoE Accounts:** Sinkronisasi, tambah, edit, hapus, dan lihat status *Online/Offline* langsung dari menu `/ppp/secret`.
*   **PPPoE Profiles:** Konfigurasi *rate-limit* dan DNS.
*   **Bandwidth Queues:** Pemantauan dan pengaturan batas kecepatan *Simple Queue*.
*   **IP & Network:** Pantau *DHCP Leases*, *ARP Table*, Daftar *IP Address*, dan *Routing Table*.
*   **Security & Hotspot:** Pemantauan *Firewall Rules*, Isolasi IP, dan status *Hotspot Active*.

### 🔒 Keamanan & Autentikasi
*   Sistem otentikasi menggunakan **NextAuth**.
*   Pembagian peran (*Role-based*): **SUPER_ADMIN**, **ADMIN**, dan **TECHNICIAN**.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** JavaScript (ES6 Modules)
*   **Database:** MySQL
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **RouterOS Integration:** Custom Binary Length-Prefixed RouterOS API (Port 8728)
*   **Styling:** Vanilla CSS (CSS Variables, Flexbox, CSS Grid)

---

## ⚙️ Persyaratan Sistem (*Requirements*)

1.  **Node.js** v18 atau lebih baru.
2.  **MySQL Server** (XAMPP, Laragon, MySQL Community, dll).
3.  **Router MikroTik** dengan port API yang diaktifkan (`/ip service enable api`).

---

## 🚀 Panduan Instalasi (Getting Started)

### 1. Clone Repository
```bash
git clone https://github.com/Ballon14/billing-next.git
cd billing-next
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di folder utama (root) aplikasi, kemudian isi dengan konfigurasi database MySQL dan kredensial login Router MikroTik Anda:

```env
# Konfigurasi Database (MySQL)
DATABASE_URL="mysql://username_mysql:password_mysql@localhost:3306/nama_database"

# Konfigurasi Keamanan (NextAuth)
NEXTAUTH_SECRET="buat_string_acak_yang_panjang_disini"
NEXTAUTH_URL="http://localhost:8000"

# Kredensial MikroTik (Pastikan port API 8728 terbuka)
MIKROTIK_HOST="192.168.1.1"
MIKROTIK_USER="admin_router"
MIKROTIK_PASSWORD="password_router"

# Enkripsi internal
ENCRYPTION_KEY="secret-key-anda-disini"
```

### 4. Setup Database
Jalankan migrasi Prisma untuk membuat tabel-tabel pada database:
```bash
npx prisma db push
```
*(Opsional: Anda bisa memasukkan data default (seeding) dengan membuat script seed atau menambah user superadmin secara manual lewat basis data).*

### 5. Jalankan Aplikasi
Karena aplikasi ini mengandalkan proses latar belakang (*daemon*) untuk melakukan *cache* trafik MikroTik agar tidak membebani router, Anda perlu menjalankan dua proses secara bersamaan. Buka dua terminal:

**Terminal 1 (Menjalankan Background Daemon untuk Monitoring):**
```bash
node scripts/monitor.mjs
```

**Terminal 2 (Menjalankan Web Server Next.js):**
```bash
npm run dev
```

### 6. Akses Dashboard
Buka browser dan akses: [http://localhost:8000](http://localhost:8000)

---

## 📂 Struktur Direktori Utama

*   `/app` : Berisi struktur halaman, UI Next.js App Router, dan API Routes (`/api/*`).
*   `/lib` : Inti logika sistem (Service MikroTik, Klien API RouterOS kustom, Prisma, dan Utils).
*   `/scripts` : *Daemon/Service* (*Background worker* seperti `monitor.mjs`).
*   `/data` : Folder sementara penyimpanan JSON cache (`cache.json`) dari *daemon*.
*   `/prisma` : Skema struktur database MySQL (`schema.prisma`).
*   `/public` : Berkas statis pendukung (aset gambar, font).

---

## 📝 Catatan Tambahan
*   **Port API MikroTik**: Pastikan API MikroTik dalam keadaan aktif dengan menjalankan perintah `ip service enable api` pada terminal MikroTik Anda (Port default: `8728`).
*   Pastikan koneksi PC/Server yang menjalankan aplikasi ini dapat melakukan proses "Ping" menuju alamat IP Router MikroTik.

---

> Dibuat untuk memudahkan manajemen operasional jaringan (RT/RW Net, ISP Skala Menengah) agar lebih terintegrasi dalam satu pintu.
