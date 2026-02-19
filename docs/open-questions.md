# Open Questions & Decisions Log
## Aplikasi Berita

**Catatan:** Dokumen ini melacak pertanyaan terbuka, keputusan yang sudah dibuat, dan risiko yang perlu ditangani. Update secara rutin seiring perkembangan proyek.

---

## 1. Pertanyaan Terbuka (Open Questions)

> Format: **[ID]** Tanggal — Pertanyaan — Status — Pemilik

| ID | Tanggal | Pertanyaan | Status | Pemilik |
|----|---------|------------|--------|---------|
| OQ-01 | 2026-02-19 | Apakah crawler boleh menyimpan konten penuh atau hanya snippet + URL? Ada implikasi copyright. | 🔴 Belum diputuskan | Tim Legal |
| OQ-02 | 2026-02-19 | Siapa yang berwenang menambah/menghapus source URL crawler — Admin saja atau Supervisor juga? | 🟡 Dalam diskusi | Product Owner |
| OQ-03 | 2026-02-19 | Apakah wilayah assignment untuk Supervisor bisa lebih dari satu provinsi? | 🔴 Belum diputuskan | Product Owner |
| OQ-04 | 2026-02-19 | Format export dashboard: CSV saja sudah cukup, atau perlu PDF report juga? | 🟡 Dalam diskusi | Stakeholder |
| OQ-05 | 2026-02-19 | Apakah berita REJECTED boleh direvisi oleh Editor dan disubmit ulang? (lihat state machine) | 🔴 Belum diputuskan | Product Owner |
| OQ-06 | 2026-02-19 | Berapa lama data jurnal dan trending topics disimpan sebelum di-archive? | 🔴 Belum diputuskan | Tim Teknis |
| OQ-07 | 2026-02-19 | Apakah perlu fitur multi-bahasa (i18n) untuk UI? | 🟢 Tidak untuk MVP | Tim Teknis |
| OQ-08 | 2026-02-19 | Strategi deployment: bare-metal VM, Docker Compose, atau Kubernetes? | 🟡 Dalam diskusi | DevOps |

---

## 2. Keputusan yang Sudah Dibuat (Decision Log)

| ID | Tanggal | Keputusan | Alasan |
|----|---------|-----------|--------|
| D-01 | 2026-02-17 | Backend: **Spring Boot 3 + PostgreSQL** | Mature ecosystem, tim familiar, JPA simplifikasi ORM |
| D-02 | 2026-02-17 | Frontend: **React + Vite + Vanilla CSS** | Kontrol penuh styling, tidak bergantung pada framework CSS |
| D-03 | 2026-02-17 | Auth: **JWT Bearer Token** | Stateless, cocok untuk REST API + SPA |
| D-04 | 2026-02-17 | Crawler library: **Jsoup** | Simple, Java-native, cukup untuk HTML parsing tanpa JS rendering |
| D-05 | 2026-02-19 | Audit: **Journal Entry pattern** (immutable log) | Mendukung audit kebijakan, replay state, dan analitik historis |
| D-06 | 2026-02-19 | Deduplication: **SHA-256 hash dari source URL** | Simple dan deterministik, tidak perlu ML similarity |
| D-07 | 2026-02-19 | Wilayah: **34 provinsi Indonesia** (hardcoded seed) | Scope yang jelas dan stabil untuk MVP |
| D-08 | 2026-02-19 | Trending topics: **keyword frequency per hari** | Cukup untuk MVP; bisa diupgrade ke TF-IDF atau NLP di v2 |

---

## 3. Risiko & Mitigasi

| ID | Risiko | Level | Mitigasi |
|----|--------|-------|---------|
| R-01 | Situs target memblokir crawler (IP ban) | 🔴 Tinggi | Implementasi rate limiting, user-agent jelas, rotasi IP (v2) |
| R-02 | Perubahan struktur HTML situs target merusak parser | 🟠 Sedang | Monitoring gagal crawl via journal; alert jika 3x gagal berturut |
| R-03 | Volume berita crawled sangat besar → database membengkak | 🟠 Sedang | Retention policy: hapus berita eksternal > 90 hari jika tidak ada engagement |
| R-04 | Performance dashboard lambat untuk data > 100.000 berita | 🟠 Sedang | Materialized view untuk trending; partisi tabel `news` by month |
| R-05 | Konten berita tidak relevan/hoaks masuk via crawler | 🟡 Rendah | Untuk MVP tidak difilter; v2 bisa tambah manual review queue |
| R-06 | JWT token bocor | 🔴 Tinggi | Short expiry (1 jam), refresh token pattern, HTTPS wajib di prod |

---

## 4. Decisions Needed Before Implementation Starts

Berikut pertanyaan yang **wajib dijawab** sebelum coding fase berikutnya:

1. **OQ-01**: Apakah snippet-only (max 500 karakter) sudah cukup, atau butuh full content?
2. **OQ-03**: Satu Supervisor = satu provinsi, atau bisa banyak?
3. **OQ-05**: Apakah ada state REVISION di antara REJECTED dan DRAFT?

---

## 5. Changelog

| Tanggal | Perubahan |
|---------|-----------|
| 2026-02-19 | Dokumen dibuat — initial version |
