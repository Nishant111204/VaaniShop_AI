package com.vaanishopai.exception;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    var msg = ex.getBindingResult().getAllErrors().stream()
        .findFirst()
        .map(e -> e.getDefaultMessage())
        .orElse("Validation failed");
    return build(HttpStatus.BAD_REQUEST, msg, req.getRequestURI());
  }

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
    return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ApiError> handleNotFound(NotFoundException ex, HttpServletRequest req) {
    return build(HttpStatus.NOT_FOUND, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest req) {
    log.error("Unhandled error", ex);
    return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", req.getRequestURI());
  }

  private ResponseEntity<ApiError> build(HttpStatus status, String message, String path) {
    return ResponseEntity.status(status).body(new ApiError(
        Instant.now(),
        status.value(),
        status.getReasonPhrase(),
        message,
        path
    ));
  }
}

