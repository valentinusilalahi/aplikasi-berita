package com.news.service;

import com.news.dto.DashboardAnalyticsResponse;
import com.news.dto.CategoryStatistics;
import com.news.dto.MonthlyTrendData;
import com.news.entity.News;
import com.news.entity.NewsAnalytics;
import com.news.entity.NewsStatus;
import com.news.repository.NewsAnalyticsRepository;
import com.news.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NewsAnalyticsService {

    private final NewsAnalyticsRepository analyticsRepository;
    private final NewsRepository newsRepository;

    /**
     * Create analytics record for published news
     */
    public void createAnalyticsForNews(Long newsId) {
        News news = newsRepository.findById(newsId)
            .orElseThrow(() -> new RuntimeException("News not found"));
        
        NewsAnalytics analytics = new NewsAnalytics();
        analytics.setNews(news);
        analytics.setViews(0L);
        analytics.setShares(0L);
        analytics.setComments(0L);
        analytics.setLikes(0L);
        analytics.setEngagementRate(0.0);
        analytics.setSentimentScore(0.5); // Default neutral sentiment
        
        analyticsRepository.save(analytics);
        log.info("Analytics created for news: {}", newsId);
    }

    /**
     * Update analytics metrics
     */
    public void updateAnalytics(Long newsId, Long views, Long shares, Long comments, Long likes, Double sentiment) {
        NewsAnalytics analytics = analyticsRepository.findByNewsId(newsId)
            .orElseThrow(() -> new RuntimeException("Analytics not found for news: " + newsId));
        
        analytics.setViews(views != null ? views : analytics.getViews());
        analytics.setShares(shares != null ? shares : analytics.getShares());
        analytics.setComments(comments != null ? comments : analytics.getComments());
        analytics.setLikes(likes != null ? likes : analytics.getLikes());
        analytics.setSentimentScore(sentiment != null ? sentiment : analytics.getSentimentScore());
        
        // Calculate engagement rate
        long totalInteractions = analytics.getLikes() + analytics.getComments() + analytics.getShares();
        double engagementRate = analytics.getViews() > 0 ? 
            (double) totalInteractions / analytics.getViews() * 100 : 0.0;
        analytics.setEngagementRate(engagementRate);
        
        analyticsRepository.save(analytics);
        
        // Update news engagement score
        News news = analytics.getNews();
        news.setEngagementScore(engagementScore(analytics));
        newsRepository.save(news);
    }

    /**
     * Get dashboard analytics
     */
    @Transactional(readOnly = true)
    public DashboardAnalyticsResponse getDashboardAnalytics() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        LocalDateTime now = LocalDateTime.now();
        
        // Get statistics
        Long totalPublished = newsRepository.countByStatus(NewsStatus.PUBLISHED);
        Long totalViews = newsRepository.sumViewsInDateRange(thirtyDaysAgo, now);
        Long pendingReview = newsRepository.countByStatus(NewsStatus.PENDING_REVIEW);
        Long rejectedNews = newsRepository.countByStatus(NewsStatus.REJECTED);
        
        Double avgEngagement = analyticsRepository.findAverageEngagementRate();
        Double avgSentiment = analyticsRepository.findAverageSentimentScore();
        
        // Get category statistics
        List<CategoryStatistics> categoryStats = getCategoryStatistics();
        
        // Get monthly trends
        List<MonthlyTrendData> monthlyTrends = getMonthlyTrends();
        
        return new DashboardAnalyticsResponse(
            totalPublished != null ? totalPublished : 0L,
            totalViews != null ? totalViews : 0L,
            avgEngagement != null ? avgEngagement : 0.0,
            avgSentiment != null ? avgSentiment : 0.5,
            pendingReview != null ? pendingReview : 0L,
            rejectedNews != null ? rejectedNews : 0L,
            categoryStats,
            monthlyTrends
        );
    }

    /**
     * Get category statistics
     */
    @Transactional(readOnly = true)
    private List<CategoryStatistics> getCategoryStatistics() {
        List<String> categories = newsRepository.findAllCategories();
        List<CategoryStatistics> stats = new ArrayList<>();
        
        for (String category : categories) {
            // Count news in category
            // Average engagement and views would need custom query
            stats.add(new CategoryStatistics(category, 0L, 0L, 0.0));
        }
        
        return stats;
    }

    /**
     * Get monthly trend data for last 12 months
     */
    @Transactional(readOnly = true)
    private List<MonthlyTrendData> getMonthlyTrends() {
        List<MonthlyTrendData> trends = new ArrayList<>();
        
        for (int i = 11; i >= 0; i--) {
            LocalDateTime startDate = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endDate = startDate.plusMonths(1).minusSeconds(1);
            
            Long published = newsRepository.countPublishedInDateRange(startDate, endDate);
            Long views = newsRepository.sumViewsInDateRange(startDate, endDate);
            
            String month = startDate.getMonth().toString().substring(0, 3);
            
            trends.add(new MonthlyTrendData(
                month,
                published != null ? published : 0L,
                views != null ? views : 0L,
                0.0 // Would need complex query for average sentiment per month
            ));
        }
        
        return trends;
    }

    /**
     * Calculate engagement score based on analytics
     */
    private Double engagementScore(NewsAnalytics analytics) {
        double score = 0.0;
        score += (analytics.getLikes() * 1.0) / 100.0; // Weight for likes
        score += (analytics.getComments() * 1.5) / 100.0; // Weight for comments
        score += (analytics.getShares() * 2.0) / 100.0; // Weight for shares
        score += analytics.getSentimentScore(); // Sentiment factor
        
        return Math.min(score, 10.0); // Cap at 10.0
    }

    /**
     * Get analytics for specific news
     */
    @Transactional(readOnly = true)
    public NewsAnalytics getNewsAnalytics(Long newsId) {
        return analyticsRepository.findByNewsId(newsId)
            .orElseThrow(() -> new RuntimeException("Analytics not found for news: " + newsId));
    }
}
