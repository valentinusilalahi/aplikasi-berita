# 🚀 Setup Guide - News Management System

Panduan lengkap untuk setup development environment secara lokal.

## Prerequisites

### System Requirements
- **CPU**: Minimal 2 core, recommended 4+ core
- **RAM**: Minimal 4GB, recommended 8GB
- **Disk**: 5GB free space

### Required Software

#### 1. Java Development Kit (JDK)
```bash
# Check if already installed
java -version

# If not installed, download JDK 17+
# Ubuntu/Debian:
sudo apt-get install openjdk-17-jdk

# macOS:
brew install openjdk@17

# Windows:
# Download dari https://www.oracle.com/java/technologies/downloads/
```

#### 2. Maven
```bash
# Check if already installed
mvn -version

# If not installed:
# Ubuntu/Debian:
sudo apt-get install maven

# macOS:
brew install maven

# Windows:
# Download dari https://maven.apache.org/download.cgi
```

#### 3. PostgreSQL
```bash
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Windows:
# Download installer dari https://www.postgresql.org/download/
```

#### 4. Node.js & npm
```bash
# Check if already installed
node --version
npm --version

# If not installed:
# Ubuntu/Debian:
sudo apt-get install nodejs npm

# macOS:
brew install node

# Windows:
# Download dari https://nodejs.org/
```

#### 5. Git
```bash
# Check if already installed
git --version

# If not installed:
# Ubuntu/Debian:
sudo apt-get install git

# macOS:
brew install git

# Windows:
# Download dari https://git-scm.com/
```

---

## Step 1: PostgreSQL Setup

### Linux/macOS

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Login ke PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE news_db;

# Create user with password
CREATE USER news_user WITH PASSWORD 'secure_password_123';

# Grant privileges
ALTER ROLE news_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE news_db TO news_user;

# Connect to database
\c news_db

# Run initialization script
\i /path/to/init-db.sql

# Exit psql
\q
```

### Windows

```bash
# Open Command Prompt as Administrator

# Start PostgreSQL service
net start postgresql-x64-15

# Open pgAdmin (GUI tool) atau gunakan command line:
psql -U postgres

# Di dalam psql prompt:
CREATE DATABASE news_db;
CREATE USER news_user WITH PASSWORD 'secure_password_123';
ALTER ROLE news_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE news_db TO news_user;
\c news_db
\i 'C:\path\to\init-db.sql'
\q
```

### Verify Database Connection

```bash
psql -U news_user -h localhost -d news_db
SELECT version();
\q
```

---

## Step 2: Backend Setup

### Clone Repository
```bash
git clone <repository-url>
cd news-system
```

### Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env file dengan database credentials Anda
nano .env
# atau
code .env  # Jika menggunakan VS Code
```

**Content .env:**
```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/news_db
SPRING_DATASOURCE_USERNAME=news_user
SPRING_DATASOURCE_PASSWORD=secure_password_123
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

JWT_SECRET=your-very-long-secret-key-minimum-256-bits-change-this-in-production
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

FILE_UPLOAD_DIR=./uploads
FILE_MAX_SIZE=52428800
FILE_ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,doc,docx,txt

SERVER_PORT=8080
```

### Build Project

```bash
# Download dependencies
mvn clean install

# Jika ada error, coba:
mvn clean install -DskipTests
```

### Run Backend

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using JAR
java -jar target/news-system-1.0.0.jar

# Option 3: IDE (IntelliJ/Eclipse)
# Run NewsSystemApplication.java
```

**Expected Output:**
```
Started NewsSystemApplication in X.XXX seconds
Tomcat started on port(s): 8080 (http)
```

### Test Backend

```bash
# Terminal lain, test API:
curl http://localhost:8080/api/auth/validate
# Should return 401 Unauthorized (expected)

# Try login:
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Step 3: Frontend Setup

### Navigate to Frontend Directory

```bash
cd frontend
```

### Install Dependencies

```bash
npm install
# atau jika npm slow:
npm install --legacy-peer-deps
```

### Configure Environment

```bash
# Create .env.local file
cat > .env.local << EOF
VITE_API_URL=http://localhost:8080/api
EOF
```

### Run Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v4.4.5  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Access Application

Open browser: **http://localhost:3000**

---

## Step 4: Testing Application

### Login dengan Default Credentials

| Role     | Username  | Password   |
|----------|-----------|-----------|
| Admin    | admin     | admin123  |
| Editor   | editor1   | editor123 |
| Reviewer | reviewer1 | reviewer123 |

### Test Flow 1: Create & Submit News

```
1. Login sebagai editor1
2. Go to "Create News"
3. Fill form:
   - Title: "Test News Article"
   - Content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
   - Category: "Technology"
4. Click "Save as Draft"
5. Click "Submit for Review"
6. Status berubah ke PENDING_REVIEW
```

### Test Flow 2: Approval & Publishing

```
1. Logout dan login sebagai reviewer1
2. Go to "Approval Queue"
3. Lihat pending news dari editor1
4. Review content
5. Click "Approve"
6. Click "Publish"
7. Status berubah ke PUBLISHED
```

### Test Flow 3: Analytics

```
1. Stay as reviewer1
2. Go to "Analytics"
3. View dashboard metrics
4. Click "Generate Quarterly Report"
5. Select Q1 2024
6. Click "Generate"
7. View report details
```

---

## Troubleshooting

### Issue: PostgreSQL Connection Failed

```bash
# Check PostgreSQL service
sudo systemctl status postgresql  # Linux
brew services list               # macOS

# Start service if not running
sudo systemctl start postgresql   # Linux
brew services start postgresql    # macOS

# Check credentials
psql -U news_user -h localhost -d news_db

# If still error, check postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Uncomment or set: listen_addresses = '*'

# And check pg_hba.conf:
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add or modify: host    all             news_user    127.0.0.1/32    md5
```

### Issue: Port 8080 Already in Use

```bash
# Linux/macOS: Find process using port
lsof -i :8080
# Kill process
kill -9 <PID>

# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Atau change port di application.yml:
server:
  port: 8081
```

### Issue: Port 3000 Already in Use

```bash
# Same as above, or change in vite.config.ts:
server: {
  port: 3001,
  ...
}
```

### Issue: npm Install Error

```bash
# Clear npm cache
npm cache clean --force

# Try with legacy peer deps
npm install --legacy-peer-deps

# Or update npm
npm install -g npm@latest
npm install
```

### Issue: Maven Build Error

```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Rebuild
mvn clean install -DskipTests

# If specific dependency error:
mvn dependency:resolve
mvn dependency:tree
```

### Issue: JWT Token Expired

```bash
# Delete stored token dari localStorage
# Open DevTools (F12) -> Application -> Local Storage
# Delete 'auth-storage' entry
# Refresh page dan login again
```

---

## Development Tips

### Hot Reload

**Backend (Spring Boot):**
```bash
# Add spring-boot-devtools dependency (optional)
# Then run with:
mvn spring-boot:run
# Auto-reload on file changes
```

**Frontend (React/Vite):**
```bash
npm run dev
# Auto-reload on file changes in src/
```

### Database Inspection

```bash
# Connect to database
psql -U news_user -h localhost -d news_db

# Useful commands:
\dt              # List all tables
SELECT * FROM users;
SELECT * FROM news;
SELECT COUNT(*) FROM news;
```

### API Testing Tools

```bash
# Insomnia (recommended)
# Download dari https://insomnia.rest/

# Postman
# Download dari https://www.postman.com/

# atau gunakan curl:
curl -X GET http://localhost:8080/api/news \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Logs Location

```bash
# Backend logs: console output saat running
# Frontend: DevTools -> Console

# Untuk file logs, configure di:
src/main/resources/logback-spring.xml
```

---

## Production Checklist

- [ ] Change JWT_SECRET (minimum 256 characters)
- [ ] Change database password
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS untuk domain production
- [ ] Setup environment variables properly
- [ ] Test API dengan production URLs
- [ ] Setup database backup strategy
- [ ] Configure logging untuk monitoring
- [ ] Performance testing
- [ ] Security audit
- [ ] Load testing

---

## Useful Commands

### Backend

```bash
# Build project
mvn clean package

# Run tests
mvn test

# Check dependencies
mvn dependency:tree

# Format code
mvn spring-javaformat:apply
```

### Frontend

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check (TypeScript)
npx tsc --noEmit
```

### Database

```bash
# Backup database
pg_dump -U news_user -h localhost news_db > backup.sql

# Restore database
psql -U news_user -h localhost news_db < backup.sql

# Export data
psql -U news_user -h localhost news_db -c "COPY news TO STDOUT WITH CSV HEADER" > news_export.csv
```

---

## Next Steps

1. ✅ Setup complete
2. 📚 Read API documentation
3. 🧪 Run test flows
4. 📝 Create some test data
5. 📊 Explore analytics features
6. 🚀 Deploy to production

---

**Happy coding! If you encounter any issues, check the troubleshooting section or contact the development team.**
