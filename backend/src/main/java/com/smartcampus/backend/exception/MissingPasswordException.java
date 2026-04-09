package com.smartcampus.backend.exception;

public class MissingPasswordException extends UnauthorizedException {
    public MissingPasswordException(String message) {
        super(message);
    }
}