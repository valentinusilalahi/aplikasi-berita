package com.news.repository;

import com.news.entity.NewsAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NewsAnalyticsRepository extends JpaRepository<NewsAnalytics, Long> {
    Optional<NewsAnalytics> findByNewsId(Long newsId);
    
    @Query("SELECT AVG(na.engagementRate) FROM NewsAnalytics na")
    Double findAverageEngagementRate();
    
    @Query("SELECT AVG(na.sentimentScore) FROM NewsAnalytics na")
    Double findAverageSentimentScore();
}
