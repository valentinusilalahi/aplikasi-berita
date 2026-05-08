package com.news.controller;

import com.news.dto.DashboardAnalyticsResponse;
import com.news.dto.GenerateQuarterlyReportRequest;
import com.news.dto.QuarterlyReportResponse;
import com.news.service.NewsAnalyticsService;
import com.news.service.QuarterlyReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final NewsAnalyticsService analyticsService;
    private final QuarterlyReportService quarterlyReportService;

    /**
     * Get dashboard analytics
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<DashboardAnalyticsResponse> getDashboardAnalytics() {
        log.info("Fetching dashboard analytics");
        DashboardAnalyticsResponse response = analyticsService.getDashboardAnalytics();
        return ResponseEntity.ok(response);
    }

    /**
     * Get analytics for specific news
     */
    @GetMapping("/news/{newsId}")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<?> getNewsAnalytics(@PathVariable Long newsId) {
        log.info("Fetching analytics for news: {}", newsId);
        var analytics = analyticsService.getNewsAnalytics(newsId);
        
        return ResponseEntity.ok(new NewsAnalyticsDto(
            analytics.getId(),
            analytics.getNews().getId(),
            analytics.getViews(),
            analytics.getShares(),
            analytics.getComments(),
            analytics.getLikes(),
            analytics.getEngagementRate(),
            analytics.getSentimentScore(),
            analytics.getKeywordAnalysis()
        ));
    }

    /**
     * Generate quarterly report
     */
    @PostMapping("/quarterly/generate")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<QuarterlyReportResponse> generateQuarterlyReport(
            @Valid @RequestBody GenerateQuarterlyReportRequest request) {
        log.info("Generating quarterly report for Q{} {}", request.getQuarter(), request.getYear());
        
        QuarterlyReportResponse response = quarterlyReportService.generateQuarterlyReport(
            request.getQuarter(), 
            request.getYear()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get quarterly report
     */
    @GetMapping("/quarterly/{quarter}/{year}")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<QuarterlyReportResponse> getQuarterlyReport(
            @PathVariable Integer quarter,
            @PathVariable Integer year) {
        log.info("Fetching quarterly report Q{} {}", quarter, year);
        QuarterlyReportResponse response = quarterlyReportService.getQuarterlyReport(quarter, year);
        return ResponseEntity.ok(response);
    }

    /**
     * Get yearly reports
     */
    @GetMapping("/quarterly/year/{year}")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<List<QuarterlyReportResponse>> getYearlyReports(@PathVariable Integer year) {
        log.info("Fetching yearly reports for {}", year);
        List<QuarterlyReportResponse> reports = quarterlyReportService.getYearlyReports(year);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get recent quarterly reports
     */
    @GetMapping("/quarterly/recent")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<List<QuarterlyReportResponse>> getRecentReports(
            @RequestParam(defaultValue = "4") Integer limit) {
        log.info("Fetching {} recent quarterly reports", limit);
        List<QuarterlyReportResponse> reports = quarterlyReportService.getRecentReports(limit);
        return ResponseEntity.ok(reports);
    }

    /**
     * News Analytics DTO
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class NewsAnalyticsDto {
        private Long id;
        private Long newsId;
        private Long views;
        private Long shares;
        private Long comments;
        private Long likes;
        private Double engagementRate;
        private Double sentimentScore;
        private String keywordAnalysis;
    }
}
