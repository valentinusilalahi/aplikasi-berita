package com.news.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "quarterly_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class QuarterlyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer quarter; // 1, 2, 3, 4

    @Column(nullable = false)
    private Integer year;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(columnDefinition = "TEXT")
    private String policyInsights;

    @Column(nullable = false)
    private Long totalNewsPublished = 0L;

    @Column(nullable = false)
    private Long totalViews = 0L;

    @Column(nullable = false)
    private Double averageEngagementRate = 0.0;

    @Column(nullable = false)
    private Double averageSentimentScore = 0.0;

    @Column(columnDefinition = "TEXT")
    private String topCategories;

    @Column(columnDefinition = "TEXT")
    private String topKeywords;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

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
