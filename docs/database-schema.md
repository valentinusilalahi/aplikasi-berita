# Database Schema & Data Model
## Aplikasi Berita

**Versi:** 0.1  
**Tanggal:** 2026-02-19

---

## 1. ERD Overview

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  regions │◄────│    users     │     │news_sources │
│──────────│     │──────────────│     │─────────────│
│ id (PK)  │     │ id (PK)      │     │ id (PK)     │
│ name     │     │ username     │     │ name        │
│ code     │     │ password     │     │ base_url    │
└────┬─────┘     │ role         │     │ is_active   │
     │           │ region_id(FK)│     └──────┬──────┘
     │           └──────┬───────┘            │
     │                  │                    │
     │           ┌──────▼───────────────────▼┐
     └──────────►│           news             │
                 │────────────────────────────│
                 │ id (PK)                    │
                 │ title                      │
                 │ content                    │
                 │ source       (INTERNAL/    │
                 │               EXTERNAL)   │
                 │ status       (DRAFT/       │
                 │               PENDING/     │
                 │               APPROVED/    │
                 │               REJECTED)    │
                 │ author_id (FK → users)     │
                 │ region_id (FK → regions)   │
                 │ source_url (nullable)      │
                 │ news_source_id (nullable,  │
                 │   FK → news_sources)       │
                 │ published_at               │
                 │ created_at                 │
                 │ updated_at                 │
                 └──────┬─────────────────────┘
                        │
          ┌─────────────▼──────────────────┐
          │        journal_entries          │
          │─────────────────────────────────│
          │ id (PK, UUID)                   │
          │ entity_type  (NEWS/CRAWL/USER)  │
          │ entity_id                       │
          │ action       (CREATED/SUBMITTED/│
          │               APPROVED/REJECTED/│
          │               CRAWLED/INDEXED)  │
          │ actor_id (FK → users, nullable) │
          │ actor_type   (USER/SYSTEM)      │
          │ payload      (JSONB)            │
          │ created_at                      │
          └────────────────────────────────┘
```

---

## 2. DDL — Tabel Lengkap

### 2.1 `regions`
```sql
CREATE TABLE regions (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL,
    code    VARCHAR(10)  NOT NULL UNIQUE  -- e.g. 'ID-JK', 'ID-JB'
);
```

### 2.2 `users`
```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,  -- BCrypt hash
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('EDITOR','SUPERVISOR','ADMIN')),
    region_id   INT REFERENCES regions(id),  -- NULL for EDITOR & ADMIN
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 2.3 `news_sources`
```sql
CREATE TABLE news_sources (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    base_url    VARCHAR(255) NOT NULL,
    crawl_path  VARCHAR(255),            -- path CSS/XPath ke artikel list
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    last_crawled_at TIMESTAMP
);
```

### 2.4 `news`
```sql
CREATE TABLE news (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    content         TEXT,
    summary         TEXT,                -- auto-generated excerpt
    source          VARCHAR(20) NOT NULL CHECK (source IN ('INTERNAL','EXTERNAL')),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED')),
    author_id       INT REFERENCES users(id),
    region_id       INT REFERENCES regions(id),
    source_url      VARCHAR(1000),       -- for EXTERNAL news, original URL
    url_hash        VARCHAR(64) UNIQUE,  -- SHA256 of source_url, for dedup
    news_source_id  INT REFERENCES news_sources(id),
    image_url       VARCHAR(500),
    published_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_status    ON news(status);
CREATE INDEX idx_news_region    ON news(region_id);
CREATE INDEX idx_news_source    ON news(source);
CREATE INDEX idx_news_created   ON news(created_at DESC);
```

### 2.5 `journal_entries`
```sql
CREATE TABLE journal_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('NEWS','CRAWL_JOB','USER_ACTION')),
    entity_id   BIGINT,
    action      VARCHAR(30) NOT NULL,
    actor_id    INT REFERENCES users(id),  -- NULL if actor_type = SYSTEM
    actor_type  VARCHAR(10) NOT NULL CHECK (actor_type IN ('USER','SYSTEM')),
    payload     JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_entity   ON journal_entries(entity_type, entity_id);
CREATE INDEX idx_journal_action   ON journal_entries(action);
CREATE INDEX idx_journal_created  ON journal_entries(created_at DESC);
```

### 2.6 `news_keywords`
```sql
-- keyword index untuk trending calculation
CREATE TABLE news_keywords (
    id          SERIAL PRIMARY KEY,
    news_id     INT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    keyword     VARCHAR(100) NOT NULL,
    frequency   INT NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_keywords_news    ON news_keywords(news_id);
CREATE INDEX idx_keywords_keyword ON news_keywords(keyword);
```

### 2.7 `trending_topics`
```sql
CREATE TABLE trending_topics (
    id          SERIAL PRIMARY KEY,
    topic       VARCHAR(200) NOT NULL,
    region_id   INT REFERENCES regions(id),  -- NULL = nationwide
    count       INT NOT NULL DEFAULT 0,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(topic, region_id, date)
);

CREATE INDEX idx_trending_date   ON trending_topics(date DESC);
CREATE INDEX idx_trending_region ON trending_topics(region_id);
```

---

## 3. Data Model (Java Entity Mapping)

### 3.1 Enum Definitions

```java
public enum UserRole    { EDITOR, SUPERVISOR, ADMIN }
public enum NewsSource  { INTERNAL, EXTERNAL }
public enum NewsStatus  { DRAFT, PENDING, APPROVED, REJECTED }
public enum EntityType  { NEWS, CRAWL_JOB, USER_ACTION }
public enum ActorType   { USER, SYSTEM }
```

### 3.2 Relasi Ringkas

| Entity | Relations |
|--------|-----------|
| `User` | `@ManyToOne Region` |
| `News` | `@ManyToOne User (author)`, `@ManyToOne Region`, `@ManyToOne NewsSource` |
| `JournalEntry` | `@ManyToOne User (actor, nullable)` |
| `NewsKeyword` | `@ManyToOne News` |
| `TrendingTopic` | `@ManyToOne Region (nullable)` |

---

## 4. Seed Data

### Regions (34 Provinsi Indonesia)
```sql
INSERT INTO regions (name, code) VALUES
  ('DKI Jakarta', 'ID-JK'),
  ('Jawa Barat', 'ID-JB'),
  ('Jawa Tengah', 'ID-JT'),
  ('Jawa Timur', 'ID-JI'),
  ('Banten', 'ID-BT'),
  ('Bali', 'ID-BA'),
  ('Sumatera Utara', 'ID-SU'),
  ('Sumatera Selatan', 'ID-SS'),
  -- ... (total 34 provinces)
  ('Papua', 'ID-PA');
```

### Default Admin User
```sql
INSERT INTO users (username, email, password, role) VALUES
  ('admin', 'admin@aplikasi-berita.id', '$2a$10$...bcrypt...', 'ADMIN');
```
