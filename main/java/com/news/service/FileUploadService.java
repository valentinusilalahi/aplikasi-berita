package com.news.service;

import com.news.entity.NewsAttachment;
import com.news.repository.NewsAttachmentRepository;
import com.news.repository.NewsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
@Transactional
public class FileUploadService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${file.max-size:52428800}")
    private long maxFileSize;

    @Value("${file.allowed-extensions:jpg,jpeg,png,pdf,doc,docx,txt}")
    private String allowedExtensions;

    private final NewsRepository newsRepository;
    private final NewsAttachmentRepository attachmentRepository;

    public FileUploadService(NewsRepository newsRepository, NewsAttachmentRepository attachmentRepository) {
        this.newsRepository = newsRepository;
        this.attachmentRepository = attachmentRepository;
    }

    /**
     * Upload file attachment for news
     */
    public NewsAttachment uploadNewsAttachment(Long newsId, MultipartFile file) throws IOException {
        
        // Validate news exists
        var news = newsRepository.findById(newsId)
            .orElseThrow(() -> new RuntimeException("News not found with id: " + newsId));
        
        // Validate file
        validateFile(file);
        
        // Create upload directory if not exists
        File uploadDirectory = new File(uploadDir);
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs();
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID() + "." + fileExtension;
        
        // Save file
        Path filePath = Paths.get(uploadDir, uniqueFilename);
        Files.write(filePath, file.getBytes());
        
        log.info("File uploaded: {} for news: {}", uniqueFilename, newsId);
        
        // Create attachment record
        NewsAttachment attachment = new NewsAttachment();
        attachment.setNews(news);
        attachment.setFileName(originalFilename);
        attachment.setFilePath(filePath.toString());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        
        return attachmentRepository.save(attachment);
    }

    /**
     * Download file
     */
    public byte[] downloadFile(Long attachmentId) throws IOException {
        NewsAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Attachment not found with id: " + attachmentId));
        
        Path filePath = Paths.get(attachment.getFilePath());
        return Files.readAllBytes(filePath);
    }

    /**
     * Delete attachment
     */
    public void deleteAttachment(Long attachmentId) throws IOException {
        NewsAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Attachment not found"));
        
        Path filePath = Paths.get(attachment.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.info("File deleted: {}", attachment.getFilePath());
        }
        
        attachmentRepository.delete(attachment);
    }

    /**
     * Delete all attachments for news
     */
    public void deleteNewsAttachments(Long newsId) throws IOException {
        var attachments = attachmentRepository.findByNewsId(newsId);
        
        for (NewsAttachment attachment : attachments) {
            Path filePath = Paths.get(attachment.getFilePath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        }
        
        attachmentRepository.deleteByNewsId(newsId);
    }

    /**
     * Validate file before upload
     */
    private void validateFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds maximum allowed size of " + maxFileSize + " bytes");
        }
        
        // Check file extension
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String[] allowedExts = allowedExtensions.split(",");
        
        boolean isAllowed = false;
        for (String ext : allowedExts) {
            if (ext.trim().equalsIgnoreCase(fileExtension)) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            throw new RuntimeException("File type ." + fileExtension + " is not allowed");
        }
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
