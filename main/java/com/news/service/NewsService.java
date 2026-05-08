package com.news.service;

import com.news.dto.ApproveNewsRequest;
import com.news.dto.CreateNewsRequest;
import com.news.dto.NewsResponse;
import com.news.dto.UpdateNewsRequest;
import com.news.dto.UserInfo;
import com.news.entity.News;
import com.news.entity.NewsStatus;
import com.news.entity.User;
import com.news.repository.NewsRepository;
import com.news.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NewsService {

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;
    private final NewsAnalyticsService analyticsService;

    /**
     * Create news as draft by editor
     */
    public NewsResponse createNews(CreateNewsRequest request) {
        User currentUser = getCurrentUser();
        
        News news = new News();
        news.setTitle(request.getTitle());
        news.setContent(request.getContent());
        news.setCategory(request.getCategory());
        news.setStatus(NewsStatus.DRAFT);
        news.setCreatedBy(currentUser);
        
        News savedNews = newsRepository.save(news);
        log.info("News created with id: {}", savedNews.getId());
        
        return mapNewsToResponse(savedNews);
    }

    /**
     * Update news by owner (editor)
     */
    public NewsResponse updateNews(Long id, UpdateNewsRequest request) {
        News news = findNewsById(id);
        User currentUser = getCurrentUser();
        
        // Only editor who created it can update
        if (!news.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You don't have permission to update this news");
        }
        
        // Only draft news can be updated
        if (news.getStatus() != NewsStatus.DRAFT && news.getStatus() != NewsStatus.REJECTED) {
            throw new RuntimeException("Only draft or rejected news can be updated");
        }
        
        news.setTitle(request.getTitle());
        news.setContent(request.getContent());
        news.setCategory(request.getCategory());
        
        News updatedNews = newsRepository.save(news);
        log.info("News updated with id: {}", updatedNews.getId());
        
        return mapNewsToResponse(updatedNews);
    }

    /**
     * Submit news for review (editor to reviewer)
     */
    public NewsResponse submitForReview(Long id) {
        News news = findNewsById(id);
        User currentUser = getCurrentUser();
        
        // Only editor who created it can submit
        if (!news.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You don't have permission to submit this news");
        }
        
        if (news.getStatus() != NewsStatus.DRAFT && news.getStatus() != NewsStatus.REJECTED) {
            throw new RuntimeException("Only draft or rejected news can be submitted for review");
        }
        
        news.setStatus(NewsStatus.PENDING_REVIEW);
        News updatedNews = newsRepository.save(news);
        log.info("News submitted for review with id: {}", updatedNews.getId());
        
        return mapNewsToResponse(updatedNews);
    }

    /**
     * Approve or reject news (reviewer)
     */
    public NewsResponse approveNews(Long id, ApproveNewsRequest request) {
        News news = findNewsById(id);
        User currentUser = getCurrentUser();
        
        if (news.getStatus() != NewsStatus.PENDING_REVIEW) {
            throw new RuntimeException("Only news in PENDING_REVIEW status can be approved/rejected");
        }
        
        news.setReviewedBy(currentUser);
        
        if (request.isApprove()) {
            news.setStatus(NewsStatus.APPROVED);
            log.info("News approved with id: {}", id);
        } else {
            news.setStatus(NewsStatus.REJECTED);
            news.setRejectionReason(request.getRejectionReason());
            log.info("News rejected with id: {}", id);
        }
        
        News updatedNews = newsRepository.save(news);
        return mapNewsToResponse(updatedNews);
    }

    /**
     * Publish approved news (admin/reviewer)
     */
    public NewsResponse publishNews(Long id) {
        News news = findNewsById(id);
        
        if (news.getStatus() != NewsStatus.APPROVED) {
            throw new RuntimeException("Only approved news can be published");
        }
        
        news.setStatus(NewsStatus.PUBLISHED);
        news.setPublishedAt(LocalDateTime.now());
        
        News publishedNews = newsRepository.save(news);
        
        // Create analytics record for published news
        analyticsService.createAnalyticsForNews(publishedNews.getId());
        
        log.info("News published with id: {}", id);
        return mapNewsToResponse(publishedNews);
    }

    /**
     * Get single news with analytics
     */
    @Transactional(readOnly = true)
    public NewsResponse getNewsById(Long id) {
        News news = findNewsById(id);
        
        // Increment view count for published news
        if (news.getStatus() == NewsStatus.PUBLISHED) {
            news.setViewsCount((news.getViewsCount() != null ? news.getViewsCount() : 0L) + 1);
            newsRepository.save(news);
        }
        
        return mapNewsToResponse(news);
    }

    /**
     * Get news list with filters
     */
    @Transactional(readOnly = true)
    public Page<News> getNewsList(NewsStatus status, String category, Pageable pageable) {
        if (status != null && category != null) {
            return newsRepository.findByStatus(status, pageable);
        } else if (status != null) {
            return newsRepository.findByStatus(status, pageable);
        } else if (category != null) {
            return newsRepository.findByCategory(category, pageable);
        } else {
            return newsRepository.findAll(pageable);
        }
    }

    /**
     * Get news created by current user
     */
    @Transactional(readOnly = true)
    public Page<News> getMyNews(Pageable pageable) {
        User currentUser = getCurrentUser();
        return newsRepository.findByCreatedById(currentUser.getId(), pageable);
    }

    /**
     * Delete news (only draft)
     */
    public void deleteNews(Long id) {
        News news = findNewsById(id);
        User currentUser = getCurrentUser();
        
        if (!news.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You don't have permission to delete this news");
        }
        
        if (news.getStatus() != NewsStatus.DRAFT) {
            throw new RuntimeException("Only draft news can be deleted");
        }
        
        newsRepository.delete(news);
        log.info("News deleted with id: {}", id);
    }

    /**
     * Helper methods
     */
    @Transactional(readOnly = true)
    protected News findNewsById(Long id) {
        return newsRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("News not found with id: " + id));
    }

    protected User getCurrentUser() {
        String username = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    public NewsResponse mapNewsToResponse(News news) {
        NewsResponse response = new NewsResponse();
        response.setId(news.getId());
        response.setTitle(news.getTitle());
        response.setContent(news.getContent());
        response.setCategory(news.getCategory());
        response.setStatus(news.getStatus());
        response.setCreatedAt(news.getCreatedAt());
        response.setUpdatedAt(news.getUpdatedAt());
        response.setPublishedAt(news.getPublishedAt());
        response.setViewsCount(news.getViewsCount());
        response.setEngagementScore(news.getEngagementScore());
        response.setRejectionReason(news.getRejectionReason());
        
        if (news.getCreatedBy() != null) {
            response.setCreatedBy(new UserInfo(
                news.getCreatedBy().getId(),
                news.getCreatedBy().getUsername(),
                news.getCreatedBy().getEmail(),
                news.getCreatedBy().getRole(),
                news.getCreatedBy().isActive(),
                news.getCreatedBy().getCreatedAt()
            ));
        }

        if (news.getReviewedBy() != null) {
            response.setReviewedBy(new UserInfo(
                news.getReviewedBy().getId(),
                news.getReviewedBy().getUsername(),
                news.getReviewedBy().getEmail(),
                news.getReviewedBy().getRole(),
                news.getReviewedBy().isActive(),
                news.getReviewedBy().getCreatedAt()
            ));
        }

        return response;
    }
}
