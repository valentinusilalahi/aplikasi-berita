package com.news.service;

import com.news.dto.QuarterlyReportResponse;
import com.news.entity.News;
import com.news.entity.NewsAnalytics;
import com.news.entity.NewsStatus;
import com.news.entity.QuarterlyReport;
import com.news.repository.NewsAnalyticsRepository;
import com.news.repository.NewsRepository;
import com.news.repository.QuarterlyReportRepository;
import com.news.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class QuarterlyReportService {

    private final QuarterlyReportRepository quarterlyReportRepository;
    private final NewsRepository newsRepository;
    private final NewsAnalyticsRepository analyticsRepository;
    private final UserRepository userRepository;

    /**
     * Generate quarterly report with analysis and policy recommendations
     */
    public QuarterlyReportResponse generateQuarterlyReport(Integer quarter, Integer year) {
        
        // Validate quarter
        if (quarter < 1 || quarter > 4) {
            throw new IllegalArgumentException("Quarter must be between 1 and 4");
        }
        
        // Get date range for quarter
        LocalDateTime startDate = getQuarterStartDate(quarter, year);
        LocalDateTime endDate = getQuarterEndDate(quarter, year);
        
        // Fetch published news in this quarter
        List<News> publishedNews = newsRepository.findByStatusAndDateRange(
            NewsStatus.PUBLISHED, startDate, endDate);
        
        log.info("Generating quarterly report for Q{} {}: {} published news", 
            quarter, year, publishedNews.size());
        
        // Calculate statistics
        Long totalPublished = (long) publishedNews.size();
        Long totalViews = publishedNews.stream()
            .mapToLong(n -> n.getViewsCount() != null ? n.getViewsCount() : 0)
            .sum();
        
        Double avgEngagement = calculateAverageEngagement(publishedNews);
        Double avgSentiment = calculateAverageSentiment(publishedNews);
        
        // Get top categories
        Map<String, Long> categoryCounts = publishedNews.stream()
            .filter(n -> n.getCategory() != null)
            .collect(Collectors.groupingBy(News::getCategory, Collectors.counting()));
        
        String topCategories = formatTopItems(categoryCounts, 5);
        
        // Generate insights
        String summary = generateSummary(quarter, year, totalPublished, totalViews, avgSentiment);
        String recommendations = generateRecommendations(publishedNews, categoryCounts, avgEngagement);
        String policyInsights = generatePolicyInsights(publishedNews, avgSentiment, avgEngagement);
        
        // Create report
        QuarterlyReport report = new QuarterlyReport();
        report.setQuarter(quarter);
        report.setYear(year);
        report.setSummary(summary);
        report.setRecommendations(recommendations);
        report.setPolicyInsights(policyInsights);
        report.setTotalNewsPublished(totalPublished);
        report.setTotalViews(totalViews);
        report.setAverageEngagementRate(avgEngagement);
        report.setAverageSentimentScore(avgSentiment);
        report.setTopCategories(topCategories);
        report.setCreatedBy(getCurrentUser());
        
        QuarterlyReport savedReport = quarterlyReportRepository.save(report);
        log.info("Quarterly report saved: Q{} {}", quarter, year);
        
        return mapReportToResponse(savedReport);
    }

    /**
     * Get quarterly report
     */
    @Transactional(readOnly = true)
    public QuarterlyReportResponse getQuarterlyReport(Integer quarter, Integer year) {
        QuarterlyReport report = quarterlyReportRepository.findByQuarterAndYear(quarter, year)
            .orElseThrow(() -> new RuntimeException("Report not found for Q" + quarter + " " + year));
        
        return mapReportToResponse(report);
    }

    /**
     * Get all quarterly reports for a year
     */
    @Transactional(readOnly = true)
    public List<QuarterlyReportResponse> getYearlyReports(Integer year) {
        return quarterlyReportRepository.findByYearOrderByQuarter(year)
            .stream()
            .map(this::mapReportToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get recent quarterly reports
     */
    @Transactional(readOnly = true)
    public List<QuarterlyReportResponse> getRecentReports(Integer limit) {
        return quarterlyReportRepository.findAllByOrderByYearDescQuarterDesc().stream()
            .limit(limit)
            .map(this::mapReportToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Calculate average engagement for news list
     */
    private Double calculateAverageEngagement(List<News> newsList) {
        if (newsList.isEmpty()) return 0.0;
        
        return newsList.stream()
            .mapToDouble(n -> n.getEngagementScore() != null ? n.getEngagementScore() : 0.0)
            .average()
            .orElse(0.0);
    }

    /**
     * Calculate average sentiment from analytics
     */
    private Double calculateAverageSentiment(List<News> newsList) {
        if (newsList.isEmpty()) return 0.5;
        
        return newsList.stream()
            .mapToDouble(news -> {
                Optional<NewsAnalytics> analytics = analyticsRepository.findByNewsId(news.getId());
                return analytics.map(NewsAnalytics::getSentimentScore).orElse(0.5);
            })
            .average()
            .orElse(0.5);
    }

    /**
     * Generate summary text
     */
    private String generateSummary(Integer quarter, Integer year, Long totalPublished, 
                                   Long totalViews, Double avgSentiment) {
        StringBuilder summary = new StringBuilder();
        summary.append("Quarterly Summary Q").append(quarter).append(" ").append(year).append("\n\n");
        summary.append("Total News Published: ").append(totalPublished).append("\n");
        summary.append("Total Views: ").append(totalViews).append("\n");
        
        if (avgSentiment > 0.6) {
            summary.append("Overall Sentiment: Positive\n");
        } else if (avgSentiment < 0.4) {
            summary.append("Overall Sentiment: Negative\n");
        } else {
            summary.append("Overall Sentiment: Neutral\n");
        }
        
        summary.append("\nThis quarter showed ");
        if (totalPublished > 50) {
            summary.append("significant");
        } else if (totalPublished > 20) {
            summary.append("good");
        } else {
            summary.append("moderate");
        }
        summary.append(" publishing activity with strong audience engagement.");
        
        return summary.toString();
    }

    /**
     * Generate recommendations based on analysis
     */
    private String generateRecommendations(List<News> newsList, 
                                          Map<String, Long> categoryCounts,
                                          Double avgEngagement) {
        StringBuilder recommendations = new StringBuilder();
        recommendations.append("Strategic Recommendations:\n\n");
        
        // Top category recommendation
        if (!categoryCounts.isEmpty()) {
            String topCategory = categoryCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General");
            
            recommendations.append("1. Focus Content Strategy:\n");
            recommendations.append("   - Continue investing in '").append(topCategory)
                .append("' content as it shows highest interest\n\n");
        }
        
        // Engagement recommendation
        recommendations.append("2. Engagement Optimization:\n");
        if (avgEngagement > 5.0) {
            recommendations.append("   - Maintain current content quality and distribution strategy\n");
        } else {
            recommendations.append("   - Increase interactive elements and reader engagement tactics\n");
        }
        recommendations.append("\n");
        
        // Growth recommendation
        recommendations.append("3. Growth Opportunities:\n");
        recommendations.append("   - Expand to emerging categories with high reader interest\n");
        recommendations.append("   - Implement A/B testing for headline optimization\n");
        
        return recommendations.toString();
    }

    /**
     * Generate policy insights
     */
    private String generatePolicyInsights(List<News> newsList, Double avgSentiment, Double avgEngagement) {
        StringBuilder insights = new StringBuilder();
        insights.append("Policy Insights & Decision Points:\n\n");
        
        insights.append("1. Editorial Policy:\n");
        if (avgSentiment > 0.6) {
            insights.append("   - Positive sentiment trend indicates strong editorial direction\n");
            insights.append("   - Continue current editorial guidelines\n");
        } else {
            insights.append("   - Consider editorial guideline review for balanced coverage\n");
        }
        insights.append("\n");
        
        insights.append("2. Resource Allocation:\n");
        insights.append("   - High-performing categories warrant increased resource investment\n");
        insights.append("   - Consider hiring additional editors for growth areas\n\n");
        
        insights.append("3. Technology Investment:\n");
        if (avgEngagement > 5.0) {
            insights.append("   - Current technology stack is supporting good engagement\n");
        } else {
            insights.append("   - Invest in engagement analytics and personalization tools\n");
        }
        
        return insights.toString();
    }

    /**
     * Format top items for display
     */
    private String formatTopItems(Map<String, Long> items, int limit) {
        return items.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(limit)
            .map(e -> e.getKey() + " (" + e.getValue() + ")")
            .collect(Collectors.joining(", "));
    }

    /**
     * Get quarter start date
     */
    private LocalDateTime getQuarterStartDate(Integer quarter, Integer year) {
        int month = (quarter - 1) * 3 + 1;
        return LocalDateTime.of(year, month, 1, 0, 0, 0);
    }

    /**
     * Get quarter end date
     */
    private LocalDateTime getQuarterEndDate(Integer quarter, Integer year) {
        int month = quarter * 3;
        LocalDateTime startOfNextQuarter = LocalDateTime.of(year, month, 1, 0, 0, 0).plusMonths(1);
        return startOfNextQuarter.minusSeconds(1);
    }

    private com.news.entity.User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    private QuarterlyReportResponse mapReportToResponse(QuarterlyReport report) {
        return new QuarterlyReportResponse(
            report.getId(),
            report.getQuarter(),
            report.getYear(),
            report.getSummary(),
            report.getRecommendations(),
            report.getPolicyInsights(),
            report.getTotalNewsPublished(),
            report.getTotalViews(),
            report.getAverageEngagementRate(),
            report.getAverageSentimentScore(),
            report.getTopCategories(),
            report.getCreatedBy() != null ? report.getCreatedBy().getUsername() : "System",
            report.getCreatedAt()
        );
    }
}
