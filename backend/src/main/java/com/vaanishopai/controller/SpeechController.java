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

    // remoteAddr already reflects the real client when FORWARD_HEADERS_STRATEGY is set behind a proxy;
    // reading X-Forwarded-For directly would let anyone dodge the limit by sending a fake header.
    rateLimitService.checkSpeech(request.getRemoteAddr());
    if (audio == null || audio.isEmpty()) throw new BadRequestException("audio is required");
    if (audio.getSize() > 25 * 1024 * 1024) throw new BadRequestException("audio too large (max 25MB)");
    try {
      var lang = language != null && language.matches("[a-z]{2}") ? language : null;
      String text = speechService.transcribeWebmOpus(audio.getBytes(), lang);
      return new SpeechTranscribeResponse(text);
    } catch (BadRequestException e) {
      throw e;
    } catch (Exception e) {
      throw new BadRequestException("Failed to read audio");
    }
  }
}
