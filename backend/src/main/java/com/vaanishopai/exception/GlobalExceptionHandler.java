package com.vaanishopai.exception;

import com.vaanishopai.web.SpaPageService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private final SpaPageService spaPages;

  public GlobalExceptionHandler(SpaPageService spaPages) {
    this.spaPages = spaPages;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    var msg = ex.getBindingResult().getAllErrors().stream()
        .findFirst()
        .map(e -> e.getDefaultMessage())
        .orElse("Validation failed");
    return build(HttpStatus.BAD_REQUEST, msg, req.getRequestURI());
  }

  @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestPartException.class})
  public ResponseEntity<ApiError> handleUnreadable(Exception ex, HttpServletRequest req) {
    return build(HttpStatus.BAD_REQUEST, "Request body is missing or malformed", req.getRequestURI());
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
    return build(HttpStatus.BAD_REQUEST, "Invalid value for '" + ex.getName() + "'", req.getRequestURI());
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<ApiError> handleTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest req) {
    return build(HttpStatus.PAYLOAD_TOO_LARGE, "File is too large", req.getRequestURI());
  }

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
    return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
    return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
    return build(HttpStatus.FORBIDDEN, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ApiError> handleNotFound(NotFoundException ex, HttpServletRequest req) {
    return build(HttpStatus.NOT_FOUND, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<?> handleNoResource(NoResourceFoundException ex, HttpServletRequest req) {
    var path = req.getRequestURI();
    var accept = req.getHeader("Accept");
    boolean page = "GET".equals(req.getMethod()) && accept != null && accept.contains("text/html")
        && !path.startsWith("/api/") && !path.startsWith("/actuator");
    if (page) return spaPages.app(HttpStatus.NOT_FOUND);
    return build(HttpStatus.NOT_FOUND, "Not found", path);
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiError> handleMethod(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
    return build(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed", req.getRequestURI());
  }

  @ExceptionHandler(TooManyRequestsException.class)
  public ResponseEntity<ApiError> handleTooMany(TooManyRequestsException ex, HttpServletRequest req) {
    return build(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), req.getRequestURI());
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
