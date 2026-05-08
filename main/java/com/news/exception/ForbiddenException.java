package com.news.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ForbiddenException insufficientPermission() {
        return new ForbiddenException("You don't have permission to perform this action");
    }

    public static ForbiddenException invalidNewsStatus() {
        return new ForbiddenException("This action is not allowed for the current news status");
    }
}
