package com.news.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsAnalyticsResponse {
    private Long views;
    private Long shares;
    private Long comments;
    private Long likes;
    private Double engagementRate;
    private Double sentimentScore;
    private String keywordAnalysis;
}
