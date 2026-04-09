package com.smartcampus.backend.exception;

public class GoogleAccountLoginException extends UnauthorizedException {
    public GoogleAccountLoginException(String message) {
        super(message);
    }
}