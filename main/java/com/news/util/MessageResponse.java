package com.news.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;
    private LocalDateTime timestamp;

    public static MessageResponse of(String message) {
        return new MessageResponse(message, LocalDateTime.now());
    }
}
