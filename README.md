# Aplikasi Berita — Dashboard Analisa Kebijakan

Platform agregasi dan analitik berita berbasis web untuk mendukung pengambilan keputusan kebijakan.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | **Java 25 LTS** + **Spring Boot 4.0** |
| Database | PostgreSQL 17+ |
| Crawling | Jsoup + Virtual Threads |
| Frontend | React 18 + Vite 6 + Vanilla CSS |
| Auth | JWT (Spring Security 7) |
| DevSecOps | GitHub Actions, OWASP, Trivy, SonarQube |

---

## Documentation

| Dokumen | Deskripsi |
|---------|-----------|
| [Technology Stack](docs/technology-stack.md) | Justifikasi Java 25, Spring Boot 4.0, dan DevSecOps pipeline |
| [Requirements & Feature Spec](docs/requirements.md) | Fitur lengkap, aktor, prioritas, dan batasan |
| [Architecture Design](docs/architecture.md) | Transaction-centric architecture, journal system, flow diagram |
| [Database Schema](docs/database-schema.md) | ERD, DDL, data model, dan seed data |
| [Crawling Design](docs/crawling-design.md) | Arsitektur crawler, proses, ethics, error handling |
| [Open Questions & Decisions](docs/open-questions.md) | Log pertanyaan terbuka, keputusan, dan risiko |

---

## Quick Start

> Lihat [Setup Guide (Walkthrough)](docs/setup-guide.md) untuk instruksi lengkap.

```bash
# 1. Jalankan database
createdb news_db

# 2. Jalankan backend
cd backend && ./mvnw spring-boot:run

# 3. Jalankan frontend
cd frontend && npm install && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8080

---

## Project Structure

```
aplikasi-berita/
├── docs/                    # 📚 Design documentation
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── crawling-design.md
│   └── open-questions.md
├── backend/                 # ☕ Spring Boot application
│   └── src/
├── frontend/                # ⚛️ React application
│   └── src/
└── README.md
```
