package com.news.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsResponse {
    private Long totalNewsPublished;
    private Long totalViews;
    private Double averageEngagementRate;
    private Double averageSentimentScore;
    private Long pendingReview;
    private Long rejectedNews;
    private List<CategoryStatistics> categoryStats;
    private List<MonthlyTrendData> monthlyTrends;
}
