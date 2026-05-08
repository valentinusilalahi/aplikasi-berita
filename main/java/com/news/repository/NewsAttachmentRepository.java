package com.news.repository;

import com.news.entity.NewsAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsAttachmentRepository extends JpaRepository<NewsAttachment, Long> {
    List<NewsAttachment> findByNewsId(Long newsId);
    void deleteByNewsId(Long newsId);
}
