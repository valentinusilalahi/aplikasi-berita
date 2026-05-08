package com.news.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendData {
    private String month;
    private Long published;
    private Long views;
    private Double averageSentiment;
}
