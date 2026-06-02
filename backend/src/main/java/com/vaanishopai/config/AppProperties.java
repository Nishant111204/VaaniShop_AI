package com.vaanishopai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    Cors cors,
    Jwt jwt,
    Groq groq,
    RateLimit rateLimit
) {
  public record Cors(String allowedOrigins) {}
  public record Jwt(String secret, long expirationMs) {}
  public record Groq(String apiKey, String chatModel, String sttModel, String sttLanguage, long timeoutMs) {}
  public record RateLimit(long speechPerMinute) {}
}
