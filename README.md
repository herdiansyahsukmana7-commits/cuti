# Sistem Pengajuan & Rekap Cuti ASN (PNS & PPPK)

Aplikasi Web App Pengajuan Cuti ASN siap pakai dengan integrasi Google Apps Script (GAS) dan Google Sheets.

## Struktur Berkas:
- `index.html` : Tampilan antarmuka dashboard sesuai mockup.
- `assets/css/style.css` : Styling kustom & format cetak resmi dokumen cuti BKN.
- `assets/js/loader-pegawai.js` : Sinkronisasi data pegawai & rekap kuota cuti tahunan real-time.
- `assets/js/app.js` : Operasi CRUD pengajuan cuti, approval atasan, cetak surat, dan modal konfigurasi.
- `assets/images/brand/logo.png` : Logo ikon instansi.

## Cara Menggunakan:
1. Buka file `index.html` langsung di browser Anda.
2. Klik tombol **"⚙ Atur Kop Surat & Pejabat"** di pojok kanan atas untuk memasukkan URL Web App Google Apps Script Anda beserta data pejabat yang menandatangani cuti.
3. Semua fitur (Pengajuan, Cetak Surat, Rekap Kuota, Approval, Ekspor CSV) sudah aktif dan siap digunakan!
