package com.news.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryStatistics {
    private String category;
    private Long count;
    private Long views;
    private Double averageEngagement;
}
