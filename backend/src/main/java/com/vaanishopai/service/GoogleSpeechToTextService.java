package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaanishopai.config.AppProperties;
import com.vaanishopai.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
public class GoogleSpeechToTextService {

  private static final Logger log = LoggerFactory.getLogger(GoogleSpeechToTextService.class);
  private static final String GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

  private final AppProperties props;
  private final WebClient webClient;
  private final ObjectMapper objectMapper;

  public GoogleSpeechToTextService(AppProperties props, WebClient webClient, ObjectMapper objectMapper) {
    this.props = props;
    this.webClient = webClient;
    this.objectMapper = objectMapper;
  }

  /**
   * Transcribe audio bytes. {@code extension} must be a whitelisted audio type
   * (see SpeechController). languageOverride (e.g. "hi", "mr", "en") takes
   * priority over the configured default; pass null to use the default.
   */
  public String transcribe(byte[] audioBytes, String extension, String languageOverride) {
    if (props.groq().apiKey() == null || props.groq().apiKey().isBlank()) {
      throw new BadRequestException("GROQ_API_KEY is not set");
    }
    if (audioBytes == null || audioBytes.length == 0) {
      throw new BadRequestException("Audio is empty");
    }

    ByteArrayResource fileResource = new ByteArrayResource(audioBytes) {
      @Override public String getFilename() { return "audio." + extension; }
    };

    MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
    form.add("file", fileResource);
    form.add("model", props.groq().sttModel());

    String lang = (languageOverride != null && !languageOverride.isBlank())
        ? languageOverride
        : props.groq().sttLanguage();
    if (lang != null && !lang.isBlank()) {
      form.add("language", lang);
    }

    JsonNode resp = webClient.post()
        .uri(GROQ_WHISPER_URL)
        .header("Authorization", "Bearer " + props.groq().apiKey())
        .contentType(MediaType.MULTIPART_FORM_DATA)
        .accept(MediaType.APPLICATION_JSON)
        .bodyValue(form)
        .retrieve()
        .bodyToMono(JsonNode.class)
        .timeout(Duration.ofMillis(Math.max(1000, props.groq().timeoutMs())))
        .block();

    if (resp == null) throw new BadRequestException("Empty response from transcription API");
    JsonNode transcript = resp.get("text");
    if (transcript == null || transcript.isMissingNode() || !transcript.isTextual()) {
      log.warn("Transcription response missing text: {}", resp);
      throw new BadRequestException("Could not transcribe audio");
    }
    return transcript.asText();
  }
}
