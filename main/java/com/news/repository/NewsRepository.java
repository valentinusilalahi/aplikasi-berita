package com.news.repository;

import com.news.entity.News;
import com.news.entity.NewsStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    
    Page<News> findByStatus(NewsStatus status, Pageable pageable);
    
    Page<News> findByCreatedById(Long userId, Pageable pageable);
    
    Page<News> findByCategory(String category, Pageable pageable);
    
    @Query("SELECT n FROM News n WHERE n.status = :status AND n.createdAt >= :startDate AND n.createdAt <= :endDate")
    List<News> findByStatusAndDateRange(
        @Param("status") NewsStatus status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT n FROM News n WHERE n.status = 'PUBLISHED' ORDER BY n.viewsCount DESC LIMIT :limit")
    List<News> findTopPublishedByViews(@Param("limit") Integer limit);
    
    @Query("SELECT DISTINCT n.category FROM News n WHERE n.category IS NOT NULL")
    List<String> findAllCategories();
    
    Long countByStatus(NewsStatus status);
    
    @Query("SELECT COUNT(n) FROM News n WHERE n.createdAt >= :startDate AND n.createdAt <= :endDate AND n.status = 'PUBLISHED'")
    Long countPublishedInDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT SUM(n.viewsCount) FROM News n WHERE n.createdAt >= :startDate AND n.createdAt <= :endDate")
    Long sumViewsInDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
