# Technology Stack
## Aplikasi Berita — Justifikasi & Keputusan Teknologi

**Versi:** 0.1  
**Tanggal:** 2026-02-19

---

## 1. Ringkasan Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Runtime | Java | **25 LTS** |
| Framework Backend | Spring Boot | **4.0** |
| ORM | Spring Data JPA + Hibernate 7 | latest |
| Database | PostgreSQL | 17+ |
| Crawling | Jsoup | 1.17+ |
| Frontend | React + Vite | 18 / 6 |
| Styling | Vanilla CSS | — |
| Auth | Spring Security + JWT | 7.x |
| Build Tools | Maven (BE), npm (FE) | — |
| Containerization | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |
| Secret Management | HashiCorp Vault / Env Secrets | — |
| SAST | SonarQube | — |
| Dependency Scan | OWASP Dependency-Check | — |

---

## 2. Java 25 LTS

### Justifikasi

**Java 25** adalah rilis LTS (Long-Term Support) terbaru yang menjadi pilihan utama untuk sistem enterprise baru.

| Fitur | Relevansi untuk Aplikasi Ini |
|-------|------------------------------|
| **Virtual Threads (Project Loom — stable)** | Crawling dan approval flow melibatkan banyak operasi I/O (HTTP fetch, DB query). Virtual threads memungkinkan ribuan concurrent task dengan overhead memori jauh lebih rendah dibanding platform threads — krusial untuk multi-tenant crawling efisiensi tinggi. |
| **Structured Concurrency** | Memudahkan pengelolaan lifecycle crawler jobs yang berjalan parallel per source, dengan cancellation dan error propagation yang bersih. |
| **Sequenced Collections** | API yang lebih prediktif untuk traversal ordered data (e.g., daftar berita per tanggal). |
| **String Templates (stable)** | Menyederhanakan pembentukan query dinamis dan pesan log tanpa risiko injection. |
| **Pattern Matching (switch)** | Memperkuat type-safe handling di service layer, terutama untuk `NewsStatus` dan `JournalEntry.action` dispatch. |
| **LTS Guarantee** | Support hingga 2033+, cocok untuk investasi jangka panjang sistem pemerintahan/kebijakan. |

```java
// Contoh: Virtual Thread Executor untuk parallel crawling
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    newsSources.forEach(source ->
        executor.submit(() -> crawlerService.crawlSource(source))
    );
} // auto-shutdown & structured lifecycle
```

> **Catatan:** Virtual threads tidak memerlukan perubahan pada kode bisnis — Spring Boot 4.0 mengaktifkannya secara transparan melalui konfigurasi `spring.threads.virtual.enabled=true`.

---

## 3. Spring Boot 4.0

### Justifikasi

**Spring Boot 4.0** adalah generasi berikutnya yang dibangun di atas Spring Framework 7 dan mensyaratkan minimum Java 25.

| Perubahan / Fitur | Relevansi |
|-------------------|-----------|
| **Virtual Threads by default** | Tomcat dan Spring MVC otomatis menggunakan virtual threads tanpa konfigurasi tambahan — throughput HTTP meningkat signifikan untuk request crawling dan approval yang concurrent. |
| **Spring Security 7** | API yang lebih clean untuk JWT filter chain, method security, dan role hierarchy. Mendukung pola `SecurityFilterChain` tanpa konfigurasi XML. |
| **AOT Compilation & GraalVM Native** | Opsi compile ke native binary untuk startup < 100ms jika dibutuhkan deployment di edge/serverless. |
| **Observability First-Class** | Auto-instrumentation Micrometer + OpenTelemetry built-in. Dashboard monitoring crawler performance langsung tersedia. |
| **Improved Problem Details (RFC 9457)** | Error response API otomatis terstandarisasi tanpa boilerplate `@ExceptionHandler`. |
| **Baseline Java 25** | Konsisten dengan pilihan runtime, tidak ada risiko mismatch bytecode version. |

```yaml
# application.yml — aktifkan virtual threads (default di SB 4.0, explicit demi kejelasan)
spring:
  threads:
    virtual:
      enabled: true
  datasource:
    url: jdbc:postgresql://localhost:5432/news_db
    hikari:
      maximum-pool-size: 20   # lebih kecil dari biasanya karena VT efficient
```

---

## 4. DevSecOps Pipeline

Keamanan bukan afterthought — diintegrasikan di setiap tahap SDLC.

### 4.1 Pipeline Overview

```
Developer Push
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions CI                       │
│                                                          │
│  [1] Build & Unit Test                                   │
│      └── mvn clean test                                  │
│                                                          │
│  [2] SAST (Static Analysis)                              │
│      └── SonarQube scan                                  │
│      └── SpotBugs (security rules)                       │
│                                                          │
│  [3] Dependency Vulnerability Scan                       │
│      └── OWASP Dependency-Check mvn plugin               │
│      └── Fail build if CVSS >= 7.0                       │
│                                                          │
│  [4] Container Scan                                      │
│      └── Trivy (scan Docker image)                       │
│                                                          │
│  [5] Build Docker Image & Push to Registry               │
│                                                          │
│  [6] Deploy to Staging                                   │
│      └── docker-compose pull && up -d                    │
│                                                          │
│  [7] DAST (Dynamic Analysis) — opsional                  │
│      └── OWASP ZAP baseline scan                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Security Controls per Layer

| Layer | Control | Tools |
|-------|---------|-------|
| **Code** | No hardcoded secrets, SAST rules | SonarQube, git-secrets |
| **Dependencies** | CVE scan setiap build | OWASP Dependency-Check |
| **API** | JWT auth, rate limiting, input validation | Spring Security 7, Bucket4j |
| **Database** | Parameterized queries (JPA), principle of least privilege | Hibernate, DB roles |
| **Container** | Non-root user, minimal base image, image scan | `eclipse-temurin:25-jre-alpine`, Trivy |
| **Secrets** | Env vars / Vault, tidak pernah commit ke repo | HashiCorp Vault / GitHub Secrets |
| **Transport** | HTTPS wajib di semua environment selain localhost | TLS via reverse proxy (Nginx) |

### 4.3 GitHub Actions — Contoh Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on: [push, pull_request]

jobs:
  build-and-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Java 25
        uses: actions/setup-java@v4
        with:
          java-version: '25'
          distribution: 'temurin'

      - name: Build & Test
        run: mvn clean verify
        working-directory: backend

      - name: OWASP Dependency Check
        run: mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
        working-directory: backend

      - name: Build Docker Image
        run: docker build -t aplikasi-berita-backend:${{ github.sha }} backend/

      - name: Trivy Container Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: aplikasi-berita-backend:${{ github.sha }}
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
```

### 4.4 Dockerfile — Secure Base

```dockerfile
# backend/Dockerfile
FROM eclipse-temurin:25-jre-alpine AS runtime

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup target/aplikasi-berita-*.jar app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Dspring.threads.virtual.enabled=true", \
  "-jar", "app.jar"]
```

---

## 5. Keputusan yang Ditunda (Future Consideration)

| Topik | Catatan |
|-------|---------|
| **GraalVM Native Image** | Pertimbangkan untuk crawler microservice terpisah di v2 jika latency startup kritis |
| **Kafka / Event Streaming** | Jika volume crawl > 10 sumber dan perlu async processing antrian berita |
| **OpenTelemetry Tracing** | Aktifkan di v2 untuk distributed tracing crawler → journal → trending pipeline |
| **RBAC lebih granular** | Spring Security ACL jika perlu permission level berita individual |
