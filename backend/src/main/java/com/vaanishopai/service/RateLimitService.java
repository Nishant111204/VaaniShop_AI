package com.vaanishopai.service;

import com.vaanishopai.config.AppProperties;
import com.vaanishopai.exception.TooManyRequestsException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple fixed-window rate limiter keyed by bucket + client.
 * Uses in-memory state — suitable for single-instance deployment.
 * Replace with Redis-backed Bucket4j for multi-instance setups.
 */
@Service
public class RateLimitService {

  private static final int EVICT_THRESHOLD = 10_000;

  private record Window(long count, Instant windowStart) {
    boolean expired(Instant now) { return now.isAfter(windowStart.plusSeconds(60)); }
  }

  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
  private final long speechPerMinute;
  private final long aiPerMinute;

  public RateLimitService(AppProperties props) {
    this.speechPerMinute = props.rateLimit().speechPerMinute();
    this.aiPerMinute = props.rateLimit().aiPerMinute();
  }

  /** Speech-to-text calls. */
  public void checkSpeech(String client) {
    check("speech:" + client, speechPerMinute);
  }

  /** AI generation and edit calls, which are the expensive ones. */
  public void checkAi(String client) {
    check("ai:" + client, aiPerMinute);
  }

  boolean allow(String key, long maxPerMinute) {
    Instant now = Instant.now();
    if (windows.size() > EVICT_THRESHOLD) {
      windows.values().removeIf(w -> w.expired(now));
    }
    Window w = windows.compute(key, (k, existing) -> {
      if (existing == null || existing.expired(now)) return new Window(1, now);
      return new Window(existing.count() + 1, existing.windowStart());
    });
    return w.count() <= maxPerMinute;
  }

  private void check(String key, long maxPerMinute) {
    if (!allow(key, maxPerMinute)) {
      throw new TooManyRequestsException("Too many requests. Please wait a minute and try again.");
    }
  }
}
