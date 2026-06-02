package com.vaanishopai.controller;

import com.vaanishopai.dto.SpeechTranscribeResponse;
import com.vaanishopai.exception.BadRequestException;
import com.vaanishopai.service.GoogleSpeechToTextService;
import com.vaanishopai.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
public class SpeechController {

  private final GoogleSpeechToTextService speechService;
  private final RateLimitService rateLimitService;

  public SpeechController(GoogleSpeechToTextService speechService, RateLimitService rateLimitService) {
    this.speechService = speechService;
    this.rateLimitService = rateLimitService;
  }

  @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public SpeechTranscribeResponse transcribe(
      @RequestPart("audio") MultipartFile audio,
      @RequestParam(value = "language", required = false) String language,
      HttpServletRequest request) {

    String clientIp = resolveClientIp(request);
    if (!rateLimitService.allowSpeech(clientIp)) {
      throw new BadRequestException("Too many requests. Please wait a moment before trying again.");
    }
    if (audio == null || audio.isEmpty()) throw new BadRequestException("audio is required");
    if (audio.getSize() > 25 * 1024 * 1024) throw new BadRequestException("audio too large (max 25MB)");
    try {
      String text = speechService.transcribeWebmOpus(audio.getBytes(), language);
      return new SpeechTranscribeResponse(text);
    } catch (BadRequestException e) {
      throw e;
    } catch (Exception e) {
      throw new BadRequestException("Failed to read audio");
    }
  }

  private String resolveClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
