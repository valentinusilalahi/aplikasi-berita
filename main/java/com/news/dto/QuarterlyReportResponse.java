package com.news.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuarterlyReportResponse {
    private Long id;
    private Integer quarter;
    private Integer year;
    private String summary;
    private String recommendations;
    private String policyInsights;
    private Long totalNewsPublished;
    private Long totalViews;
    private Double averageEngagementRate;
    private Double averageSentimentScore;
    private String topCategories;
    private String topKeywords;
    private String createdByUsername;
    private LocalDateTime createdAt;

    public QuarterlyReportResponse(Long id, Integer quarter, Integer year, String summary, String recommendations, String policyInsights, Long totalNewsPublished, Long totalViews, Double averageEngagementRate, Double averageSentimentScore, String topCategories, String s, LocalDateTime createdAt) {

    }
}

