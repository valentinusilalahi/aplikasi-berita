# Architecture Design
## Aplikasi Berita — Transaction-Centric Architecture

**Versi:** 0.1 (Initial Draft)  
**Tanggal:** 2026-02-19

---

## 1. Prinsip Arsitektur

Arsitektur sistem ini mengadopsi pola **Transaction-Centric** dengan **Journal Template System**. Setiap perubahan status terhadap konten berita (pembuatan, persetujuan, penolakan, indexing) diperlakukan sebagai sebuah **transaksi yang dapat diaudit**, menggunakan template jurnal yang seragam.

> **Mengapa Transaction-Centric?**  
> Dashboard kebijakan membutuhkan *audit trail* yang lengkap. Siapa yang mengubah status berita apa, kapan, dan dengan alasan apa — harus dapat ditelusuri. Model ini memastikan bahwa setiap state change tercatat sebagai entri jurnal yang immutable.

---

## 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                    │
│  Dashboard │ News Manager │ Public Feed │ Admin Panel   │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JSON over HTTP)
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Spring Boot)                   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Controller │  │   Service    │  │  Crawler Svc  │  │
│  │   Layer     │  │   Layer      │  │  (Scheduled)  │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                │                  │           │
│  ┌──────▼──────────────────────────────────▼────────┐  │
│  │              Journal / Transaction Layer           │  │
│  │  (NewsJournal, CrawlJournal, ApprovalJournal)     │  │
│  └────────────────────────────┬──────────────────────┘  │
│                               │                          │
│  ┌────────────────────────────▼──────────────────────┐  │
│  │               Repository Layer (JPA)               │  │
│  └────────────────────────────┬──────────────────────┘  │
└───────────────────────────────┼─────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────┐
│                   PostgreSQL Database                    │
│     news, users, regions, journals, trending_topics     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Journal Template System

Setiap aksi signifikan dalam sistem menghasilkan **entri jurnal** berdasarkan template yang seragam. Ini memungkinkan:

- Audit trail yang lengkap
- Replay state dari awal jika diperlukan
- Agregasi statistik dari satu sumber kebenaran

### 3.1 Template Jurnal Umum

```
JournalEntry {
  id          : UUID (PK)
  entity_type : Enum (NEWS, CRAWL_JOB, USER_ACTION)
  entity_id   : Long (FK ke entitas yang bersangkutan)
  action      : Enum (CREATED, SUBMITTED, APPROVED, REJECTED, CRAWLED, INDEXED)
  actor_id    : Long (FK ke user, nullable untuk aksi sistem)
  actor_type  : Enum (USER, SYSTEM)
  payload     : JSONB (metadata tambahan, e.g., komentar reject, topik terindeks)
  created_at  : Timestamp
}
```

### 3.2 Template per Use Case

#### Template A — Berita Internal (News Journal)

| Aksi | actor_type | payload contoh |
|------|-----------|---------------|
| CREATED | USER | `{"title": "...", "region_id": 5}` |
| SUBMITTED | USER | `{"from_status": "DRAFT", "to_status": "PENDING"}` |
| APPROVED | USER | `{"supervisor_id": 12, "comment": "Layak terbit"}` |
| REJECTED | USER | `{"supervisor_id": 12, "reason": "Sumber tidak valid"}` |

#### Template B — Crawling Job (Crawl Journal)

| Aksi | actor_type | payload contoh |
|------|-----------|---------------|
| CRAWL_STARTED | SYSTEM | `{"source_url": "kompas.com", "trigger": "SCHEDULED"}` |
| CRAWL_COMPLETED | SYSTEM | `{"articles_found": 45, "new_articles": 12, "duplicates": 33}` |
| CRAWL_FAILED | SYSTEM | `{"error": "Connection timeout", "source_url": "detik.com"}` |
| INDEXED | SYSTEM | `{"article_id": 789, "keywords": ["banjir","jakarta"]}` |

---

## 4. Komponen Utama

### 4.1 Backend Modules

| Modul | Tanggung Jawab |
|-------|---------------|
| `AuthModule` | JWT login, registrasi, role management |
| `NewsModule` | CRUD berita internal, state machine status |
| `ApprovalModule` | Review antrian oleh supervisor per wilayah |
| `CrawlerModule` | Scheduled scraping, dedup, keyword extraction |
| `JournalModule` | Pencatatan semua transaksi ke `journal_entries` |
| `DashboardModule` | Aggregasi data untuk analytics API |
| `TrendingModule` | Perhitungan trending topics dari journal + news |

### 4.2 News Status State Machine

```
[DRAFT] ──(submit)──► [PENDING] ──(approve)──► [APPROVED]
                           │
                       (reject)
                           │
                           ▼
                       [REJECTED]
                           │
                       (revise)
                           │
                           ▼
                         [DRAFT]
```

Setiap transisi state menghasilkan **satu entri jurnal**.

### 4.3 Frontend Modules

| Halaman | Akses |
|---------|-------|
| `/login` | Public |
| `/dashboard` | SUPERVISOR, ADMIN |
| `/news/create` | EDITOR |
| `/news/approval` | SUPERVISOR |
| `/news/feed` | Public (approved only) |
| `/admin` | ADMIN |

---

## 5. Integrasi Sistem

### 5.1 Flow Berita Internal
```
Editor → POST /news (DRAFT)
       → POST /news/{id}/submit (PENDING)
Supervisor → GET /approval/queue (filter by region)
           → POST /approval/{id}/approve atau /reject
System → JOURNAL setiap transisi
Dashboard → GET /dashboard/stats (aggregate dari journal)
```

### 5.2 Flow Crawling
```
[Scheduler setiap jam]
  → CrawlerService.run()
  → Fetch HTML dari source URLs
  → Jsoup parse: judul, snippet, url, date
  → Cek duplikat (by URL hash)
  → Simpan ke `news` (source=EXTERNAL)
  → Ekstrak keywords
  → Update `trending_topics`
  → Catat ke CRAWL_JOURNAL
```

---

## 6. Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend | **Java 25 LTS**, **Spring Boot 4.0** |
| ORM | Spring Data JPA + Hibernate 7 |
| Database | PostgreSQL 17+ |
| Crawling | Jsoup |
| Scheduling | Spring `@Scheduled` + Virtual Threads (Project Loom) |
| Auth | Spring Security **7** + JWT |
| Frontend | React 18, Vite 6 |
| Styling | Vanilla CSS (Custom Design System) |
| Build | Maven (backend), npm (frontend) |
| DevSecOps | GitHub Actions, OWASP Dependency-Check, Trivy, SonarQube |

> Lihat [technology-stack.md](technology-stack.md) untuk justifikasi lengkap pemilihan Java 25 dan Spring Boot 4.0.
