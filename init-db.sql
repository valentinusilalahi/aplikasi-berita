-- Create Database
CREATE DATABASE sinodal_db;

-- Connect to database
\c sinodal_db;

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR' CHECK (role IN ('EDITOR', 'REVIEWER', 'ADMIN')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- News table
CREATE TABLE news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED')),
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    views_count BIGINT DEFAULT 0,
    engagement_score DECIMAL(10, 2) DEFAULT 0.0
);

-- News Attachments table
CREATE TABLE news_attachments (
    id BIGSERIAL PRIMARY KEY,
    news_id BIGINT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- News Analytics table
CREATE TABLE news_analytics (
    id BIGSERIAL PRIMARY KEY,
    news_id BIGINT NOT NULL UNIQUE REFERENCES news(id) ON DELETE CASCADE,
    views BIGINT NOT NULL DEFAULT 0,
    shares BIGINT NOT NULL DEFAULT 0,
    comments BIGINT NOT NULL DEFAULT 0,
    likes BIGINT NOT NULL DEFAULT 0,
    engagement_rate DECIMAL(10, 4) NOT NULL DEFAULT 0.0,
    sentiment_score DECIMAL(10, 4) NOT NULL DEFAULT 0.0,
    keyword_analysis TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quarterly Reports table
CREATE TABLE quarterly_reports (
    id BIGSERIAL PRIMARY KEY,
    quarter INTEGER NOT NULL CHECK (quarter IN (1, 2, 3, 4)),
    year INTEGER NOT NULL,
    summary TEXT,
    recommendations TEXT,
    policy_insights TEXT,
    total_news_published BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    average_engagement_rate DECIMAL(10, 4) DEFAULT 0.0,
    average_sentiment_score DECIMAL(10, 4) DEFAULT 0.0,
    top_categories TEXT,
    top_keywords TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quarter, year)
);

-- Create Indexes
CREATE INDEX idx_news_created_by ON news(created_by);
CREATE INDEX idx_news_reviewed_by ON news(reviewed_by);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_created_at ON news(created_at);
CREATE INDEX idx_news_attachments_news_id ON news_attachments(news_id);
CREATE INDEX idx_news_analytics_news_id ON news_analytics(news_id);
CREATE INDEX idx_quarterly_reports_year_quarter ON quarterly_reports(year, quarter);

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT INTO users (username, email, password, role, active) VALUES 
('admin', 'admin@news.com', '$2b$10$jRLj47RWJS7HWpCAtWyQe.gkVC5MTTEa.VQ.vsgWdK5.WeLVtIMLa', 'ADMIN', true);

-- Insert sample editor user (password: editor123)
INSERT INTO users (username, email, password, role, active) VALUES 
('editor1', 'editor1@news.com', '$2b$10$ZGiYLZe/s/85lrDZkQ7cYei0LWxi81sewGTe1zyL2eQ3U9vHglB9i', 'EDITOR', true);

-- Insert sample reviewer user (password: reviewer123)
INSERT INTO users (username, email, password, role, active) VALUES 
('reviewer1', 'reviewer1@news.com', '$2b$10$Zs33U.eaNQHyOvkBVsvhwe2cWfvBPTqZ1MO1c3E49WD1QI6w4a0Tu', 'REVIEWER', true);
