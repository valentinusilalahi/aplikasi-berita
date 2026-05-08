package com.news.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ResourceNotFoundException newsNotFound(Long id) {
        return new ResourceNotFoundException("News not found with id: " + id);
    }

    public static ResourceNotFoundException userNotFound(Long id) {
        return new ResourceNotFoundException("User not found with id: " + id);
    }

    public static ResourceNotFoundException reportNotFound(Integer quarter, Integer year) {
        return new ResourceNotFoundException(
            "Report not found for Q" + quarter + " " + year);
    }
}








