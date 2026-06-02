package com.vaanishopai.service;

import com.vaanishopai.config.AppProperties;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple sliding-window rate limiter keyed by client IP.
 * Uses in-memory state — suitable for single-instance deployment.
 * Replace with Redis-backed Bucket4j for multi-instance setups.
 */
@Service
public class RateLimitService {

  private record Window(long count, Instant windowStart) {}

  private final ConcurrentHashMap<String, Window> speechWindows = new ConcurrentHashMap<>();
  private final long maxPerMinute;

  public RateLimitService(AppProperties props) {
    this.maxPerMinute = props.rateLimit().speechPerMinute();
  }

  public boolean allowSpeech(String clientIp) {
    Instant now = Instant.now();
    speechWindows.compute(clientIp, (ip, existing) -> {
      if (existing == null || now.isAfter(existing.windowStart().plusSeconds(60))) {
        return new Window(1, now);
      }
      return new Window(existing.count() + 1, existing.windowStart());
    });
    return speechWindows.get(clientIp).count() <= maxPerMinute;
  }
}
