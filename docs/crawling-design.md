# Crawling Berita — Desain & Implementasi

**Versi:** 0.1  
**Tanggal:** 2026-02-19

---

## 1. Tujuan

Modul crawling mengumpulkan berita dari portal berita online secara **otomatis dan terjadwal** untuk:
1. Memperkaya konten dashboard (berita eksternal tidak perlu approval)
2. Menghitung trending topics berdasarkan frekuensi kemunculan kata kunci
3. Memberikan wawasan real-time tentang isu yang berkembang di media

---

## 2. Arsitektur Crawler

```
┌─────────────────────────────────────────────────────────────┐
│                    CrawlerScheduler                          │
│         (@Scheduled, setiap jam / trigger manual)           │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   CrawlerService    │
              │─────────────────────│
              │ orchestrate()       │
              │ crawlSource(source) │
              └──────────┬──────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
┌─────────▼──────────┐       ┌──────────▼─────────┐
│  HttpFetchService  │       │  ArticleParser     │
│────────────────────│       │────────────────────│
│ fetchHtml(url)     │       │ parse(html, config)│
│ respectRobots()    │       │ extractTitle()     │
│ rateLimiter()      │       │ extractContent()   │
└────────────────────┘       │ extractDate()      │
                             │ extractUrl()       │
                             └──────────┬─────────┘
                                        │
                             ┌──────────▼─────────┐
                             │  DedupService      │
                             │────────────────────│
                             │ isKnown(urlHash)   │
                             │ markKnown(urlHash) │
                             └──────────┬─────────┘
                                        │
                             ┌──────────▼─────────┐
                             │  KeywordExtractor  │
                             │────────────────────│
                             │ extract(text)      │
                             │ stopWordFilter()   │
                             │ stemming (WIP)     │
                             └──────────┬─────────┘
                                        │
                             ┌──────────▼─────────┐
                             │  TrendingUpdater   │
                             │────────────────────│
                             │ upsertTrending()   │
                             └────────────────────┘
```

---

## 3. Konfigurasi Source

Source crawling disimpan di tabel `news_sources` dan dapat dikelola Admin.

```json
{
  "name": "Kompas",
  "base_url": "https://www.kompas.com",
  "crawl_path": "https://www.kompas.com/tren/",
  "is_active": true
}
```

Alternatif untuk v1 — hardcoded list di `application.properties`:
```properties
crawler.sources=https://kompas.com/tren,https://detik.com/tren
crawler.interval-ms=3600000
crawler.max-articles-per-source=50
crawler.request-delay-ms=1000
```

---

## 4. Proses Crawling Step-by-Step

### Step 1: Fetch HTML
```java
// Gunakan Jsoup dengan User-Agent wajar
Document doc = Jsoup.connect(url)
    .userAgent("AplikasiBeritas/1.0 (+contact@example.id)")
    .timeout(10_000)
    .get();
```

### Step 2: Parse Artikel
Ekstrak daftar artikel dari halaman list:
```java
Elements articles = doc.select("article.article-list__item");
for (Element article : articles) {
    String title   = article.select("h3.article__title a").text();
    String href    = article.select("a").attr("abs:href");
    String snippet = article.select("p.article__lead").text();
    // fetch detail page jika perlu konten lengkap
}
```

> **Catatan:** Selector CSS spesifik per situs harus dikonfigurasi di `news_sources.crawl_selector_config` (JSONB).

### Step 3: Deduplication
```java
String urlHash = DigestUtils.sha256Hex(articleUrl);
if (newsRepository.existsByUrlHash(urlHash)) {
    log.info("Duplicate, skipping: {}", articleUrl);
    continue;
}
```

### Step 4: Keyword Extraction

Bahasa Indonesia — stopword list:
```
yang, dan, di, ke, dari, ini, itu, dengan, untuk, pada, adalah, 
dalam, akan, telah, tidak, juga, sebagai, oleh, atau, dapat
```

Extraction sederhana (v1):
```java
List<String> keywords = Arrays.stream(text.split("\\s+"))
    .map(String::toLowerCase)
    .map(w -> w.replaceAll("[^a-z]", ""))
    .filter(w -> w.length() > 3)
    .filter(w -> !STOPWORDS.contains(w))
    .collect(Collectors.toList());
```

### Step 5: Update Trending Topics
```java
// UPSERT per keyword per hari
INSERT INTO trending_topics (topic, region_id, count, date)
VALUES (?, ?, 1, CURRENT_DATE)
ON CONFLICT (topic, region_id, date)
DO UPDATE SET count = trending_topics.count + 1;
```

### Step 6: Catat ke Journal
```java
JournalEntry entry = JournalEntry.builder()
    .entityType(EntityType.CRAWL_JOB)
    .action("CRAWL_COMPLETED")
    .actorType(ActorType.SYSTEM)
    .payload(Map.of(
        "source", sourceName,
        "articles_found", found,
        "new_articles", saved,
        "duplicates", dupes
    ))
    .build();
journalRepository.save(entry);
```

---

## 5. Penghormatan robots.txt & Etika

| Praktik | Implementasi |
|---------|-------------|
| Cek `robots.txt` | Jsoup crawl hanya path yang diizinkan |
| Rate limiting | Delay 1 detik antara request ke sumber yang sama |
| User-Agent jelas | Identifikasi diri sebagai bot |
| Tidak crawl saat sibuk | Scheduler berjalan off-peak (jam 00:00 - 06:00 opsi) |
| Simpan URL asli | Citation lengkap ke sumber asli |

---

## 6. Error Handling

| Kondisi Error | Penanganan |
|---------------|-----------|
| Connection timeout | Retry 2x, lalu log `CRAWL_FAILED` ke journal |
| HTTP 4xx/5xx | Skip source, catat ke journal |
| Parse error (selector not found) | Log warn, artikel discarded |
| Konten duplikat | Skip silently, increment counter |
| Rate limit dari situs target | Backoff eksponensial (50ms → 100ms → 200ms) |

---

## 7. Manual Trigger (Admin)

Admin dapat memicu crawling langsung melalui API:
```
POST /api/admin/crawler/trigger
Authorization: Bearer <admin-token>

Response:
{
  "status": "STARTED",
  "crawl_job_id": "uuid-xxx",
  "message": "Crawl job queued for 3 active sources"
}
```

---

## 8. Monitoring & Observability

Query untuk melihat performa crawl historis dari `journal_entries`:
```sql
SELECT 
    payload->>'source' AS source,
    AVG((payload->>'new_articles')::int) AS avg_new_per_crawl,
    COUNT(*) AS total_crawls,
    MAX(created_at) AS last_crawl
FROM journal_entries
WHERE entity_type = 'CRAWL_JOB' AND action = 'CRAWL_COMPLETED'
GROUP BY payload->>'source'
ORDER BY total_crawls DESC;
```
