package com.news.controller;

import com.news.dto.*;
import com.news.entity.News;
import com.news.entity.NewsStatus;
import com.news.service.FileUploadService;
import com.news.service.NewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.IOException;

@RestController
@RequestMapping("/news")
@RequiredArgsConstructor
@Slf4j
public class NewsController {

    private final NewsService newsService;
    private final FileUploadService fileUploadService;

    /**
     * Create news (EDITOR role)
     */
    @PostMapping
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> createNews(@Valid @RequestBody CreateNewsRequest request) {
        log.info("Creating news: {}", request.getTitle());
        NewsResponse response = newsService.createNews(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update news (EDITOR who created it)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> updateNews(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNewsRequest request) {
        log.info("Updating news: {}", id);
        NewsResponse response = newsService.updateNews(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit news for review
     */
    @PostMapping("/{id}/submit-review")
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> submitForReview(@PathVariable Long id) {
        log.info("Submitting news for review: {}", id);
        NewsResponse response = newsService.submitForReview(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Approve or reject news (REVIEWER role)
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> approveNews(
            @PathVariable Long id,
            @Valid @RequestBody ApproveNewsRequest request) {
        log.info("Reviewing news: {} - Approved: {}", id, request.isApprove());
        NewsResponse response = newsService.approveNews(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Publish news
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> publishNews(@PathVariable Long id) {
        log.info("Publishing news: {}", id);
        NewsResponse response = newsService.publishNews(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get news by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<NewsResponse> getNews(@PathVariable Long id) {
        NewsResponse response = newsService.getNewsById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get news list with filtering
     */
    @GetMapping
    public ResponseEntity<Page<NewsResponse>> getNewsList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        NewsStatus newsStatus = status != null ? NewsStatus.valueOf(status) : null;
        Page<News> newsPage = newsService.getNewsList(newsStatus, category, pageable);
        
        Page<NewsResponse> responsePage = newsPage.map(newsService::mapNewsToResponse);

        return ResponseEntity.ok(responsePage);
    }

    /**
     * Get my news (created by current user)
     */
    @GetMapping("/my-news")
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public ResponseEntity<Page<NewsResponse>> getMyNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<News> newsPage = newsService.getMyNews(pageable);
        
        Page<NewsResponse> responsePage = newsPage.map(newsService::mapNewsToResponse);

        return ResponseEntity.ok(responsePage);
    }

    /**
     * Delete news (only draft)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteNews(@PathVariable Long id) {
        log.info("Deleting news: {}", id);
        newsService.deleteNews(id);
        return ResponseEntity.ok(new ApiResponse("News deleted successfully"));
    }

    /**
     * Upload attachment for news
     */
    @PostMapping("/{id}/upload")
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Uploading attachment for news: {}", id);
            var attachment = fileUploadService.uploadNewsAttachment(id, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                new AttachmentUploadResponse(
                    attachment.getId(),
                    attachment.getFileName(),
                    attachment.getFileSize(),
                    attachment.getFileType()
                )
            );
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("File upload failed: " + e.getMessage()));
        }
    }

    /**
     * Get news statistics
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getNewsStats(@PathVariable Long id) {
        // This will be used by frontend to display detailed analytics
        return ResponseEntity.ok(new ApiResponse("Stats retrieved"));
    }

    /**
     * API Response wrappers
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ApiResponse {
        private String message;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AttachmentUploadResponse {
        private Long id;
        private String fileName;
        private Long fileSize;
        private String fileType;
    }
}
