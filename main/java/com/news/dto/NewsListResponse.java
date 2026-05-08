package com.news.dto;

import com.news.entity.NewsStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsListResponse {
    private Long id;
    private String title;
    private String category;
    private NewsStatus status;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private Long viewsCount;
}
