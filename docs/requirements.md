# Requirements & Feature Specification
## Aplikasi Berita — Dashboard Analisa Kebijakan

**Versi:** 0.1 (Initial Draft)  
**Tanggal:** 2026-02-19  
**Status:** Draft

---

## 1. Latar Belakang

Aplikasi ini dirancang sebagai **platform agregasi berita berbasis web** yang membantu pengambil kebijakan (policymakers) menganalisis tren berita dari berbagai sumber. Sistem mengintegrasikan dua jalur berita:

1. **Berita Internal** — ditulis oleh editor internal, melewati alur persetujuan berbasis wilayah.
2. **Berita Eksternal (Crawled)** — dikumpulkan secara otomatis dari portal berita online untuk analisis tren topik.

Dashboard berfungsi sebagai **pusat komando analitik** bagi pengambil kebijakan untuk memahami isu-isu yang sedang berkembang di masyarakat berdasarkan wilayah.

---

## 2. Stakeholder & Aktor

| Aktor | Deskripsi |
|-------|-----------|
| **Editor** | Membuat dan mengunggah berita internal. Tidak memiliki akses persetujuan. |
| **Supervisor** | Menyetujui atau menolak berita dari editor di wilayahnya. |
| **Admin** | Mengelola pengguna, wilayah, dan sumber crawling. |
| **Pengambil Kebijakan** | Konsumen utama dashboard analitik (bisa berlevel Supervisor atau Admin). |

---

## 3. Fitur Utama

### 3.1 Dashboard Analitik Kebijakan

Ini adalah fitur utama yang menjadi **nilai inti** aplikasi.

| ID | Fitur | Prioritas |
|----|-------|-----------|
| D-01 | **Trending Topics** — Daftar topik/kata kunci yang paling banyak muncul hari ini dari berita crawled + internal | P0 |
| D-02 | **Peta Sebaran Berita** — Visualisasi heatmap/choropleth berita per provinsi/wilayah | P0 |
| D-03 | **Timeline Tren** — Grafik frekuensi topik tertentu dari waktu ke waktu (7 hari / 30 hari) | P1 |
| D-04 | **Statistik Volume** — Jumlah total berita: aktif, pending, ditolak, crawled | P0 |
| D-05 | **Filter Wilayah** — Dashboard dapat difilter berdasarkan provinsi | P1 |
| D-06 | **Sentimen Kasar** — Klasifikasi sederhana (positif/negatif/netral) berbasis keyword | P2 |
| D-07 | **Export Data** — Export tabel tren ke CSV/Excel | P2 |

### 3.2 Manajemen Berita Internal

| ID | Fitur | Prioritas |
|----|-------|-----------|
| N-01 | Editor membuat draft berita (judul, isi, kategori, wilayah) | P0 |
| N-02 | Editor mengunggah lampiran gambar | P1 |
| N-03 | Berita berstatus **DRAFT → PENDING** saat disubmit | P0 |
| N-04 | Supervisor melihat antrian berita berstatus PENDING hanya dari wilayahnya | P0 |
| N-05 | Supervisor dapat **APPROVE** atau **REJECT** dengan komentar | P0 |
| N-06 | Berita yang disetujui berstatus **APPROVED** dan tampil di public feed | P0 |
| N-07 | Editor mendapat notifikasi hasil review | P2 |

### 3.3 Crawling Berita Eksternal

| ID | Fitur | Prioritas |
|----|-------|-----------|
| C-01 | Scheduled crawler berjalan otomatis (setiap jam) | P0 |
| C-02 | Source URL dikonfigurasi oleh Admin (daftar situs target) | P0 |
| C-03 | Crawler mengekstrak: judul, cuplikan, URL asli, tanggal, sumber | P0 |
| C-04 | Deduplication: berita dengan URL yang sama tidak disimpan ulang | P0 |
| C-05 | Penghormatan `robots.txt` dan rate limiting | P0 |
| C-06 | Indexing kata kunci untuk perhitungan trending | P0 |
| C-07 | Admin dapat trigger crawling secara manual | P1 |

### 3.4 Autentikasi & Otorisasi

| ID | Fitur | Prioritas |
|----|-------|-----------|
| A-01 | Login berbasis JWT | P0 |
| A-02 | Role-based access control (EDITOR / SUPERVISOR / ADMIN) | P0 |
| A-03 | Supervisor hanya bisa akses data wilayah yang ditugaskan | P0 |

---

## 4. Non-Functional Requirements

| Kategori | Ketentuan |
|----------|-----------|
| **Performa** | Dashboard harus load dalam < 3 detik untuk dataset hingga 10.000 berita |
| **Skalabilitas** | Arsitektur harus mendukung penambahan crawler sources tanpa perubahan skema besar |
| **Keamanan** | Password di-hash (BCrypt), akses endpoint dilindungi JWT |
| **Ketersediaan** | Crawler harus berjalan mandiri; kegagalan crawler tidak mengganggu layanan utama |
| **Audit** | Semua aksi approval/rejection harus tercatat (siapa, kapan, alasan) |

---

## 5. Batasan & Asumsi

- Wilayah berbasis **34 provinsi Indonesia**.
- Crawling hanya untuk sumber terbuka (tidak memerlukan login ke situs target).
- Analisis sentimen fase awal cukup berbasis **keyword matching** (bukan ML).
- MVP tidak mencakup real-time notification (WebSocket direncanakan untuk v2).
