package com.news.dto;

import com.news.entity.NewsStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsResponse {
    private Long id;
    private String title;
    private String content;
    private String category;
    private NewsStatus status;
    private UserInfo createdBy;
    private UserInfo reviewedBy;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private Long viewsCount;
    private Double engagementScore;
    private List<AttachmentResponse> attachments;
    private NewsAnalyticsResponse analytics;
}
