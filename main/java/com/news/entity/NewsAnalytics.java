package com.news.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "news_analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "news_id", nullable = false, unique = true)
    private News news;

    @Column(nullable = false)
    private Long views = 0L;

    @Column(nullable = false)
    private Long shares = 0L;

    @Column(nullable = false)
    private Long comments = 0L;

    @Column(nullable = false)
    private Long likes = 0L;

    @Column(nullable = false)
    private Double engagementRate = 0.0;

    @Column(nullable = false)
    private Double sentimentScore = 0.0; // -1.0 to 1.0

    @Column(columnDefinition = "TEXT")
    private String keywordAnalysis;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
