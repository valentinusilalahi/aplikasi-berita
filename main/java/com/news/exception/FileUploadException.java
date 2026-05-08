package com.news.exception;

public class FileUploadException extends RuntimeException {
    public FileUploadException(String message) {
        super(message);
    }

    public FileUploadException(String message, Throwable cause) {
        super(message, cause);
    }

    public static FileUploadException invalidFileType(String type) {
        return new FileUploadException("File type ." + type + " is not allowed");
    }

    public static FileUploadException fileTooLarge(long maxSize) {
        return new FileUploadException(
                "File size exceeds maximum allowed size of " + (maxSize / 1024 / 1024) + "MB");
    }
}
