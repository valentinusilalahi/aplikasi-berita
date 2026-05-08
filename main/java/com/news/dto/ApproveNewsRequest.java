package com.news.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApproveNewsRequest {
    private boolean approve;
    private String rejectionReason; // Only when approve is false
}
