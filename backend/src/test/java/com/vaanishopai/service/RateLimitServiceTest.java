package com.vaanishopai.service;

import com.vaanishopai.config.AppProperties;
import com.vaanishopai.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitServiceTest {

  private final RateLimitService limiter = new RateLimitService(
      new AppProperties(null, null, null, new AppProperties.RateLimit(3, 2), null));

  @Test
  void blocksAfterLimitPerClient() {
    limiter.checkAi("1.1.1.1");
    limiter.checkAi("1.1.1.1");
    assertThrows(TooManyRequestsException.class, () -> limiter.checkAi("1.1.1.1"));
    assertDoesNotThrow(() -> limiter.checkAi("2.2.2.2"), "other clients are unaffected");
  }

  @Test
  void bucketsAreIndependent() {
    limiter.checkAi("1.1.1.1");
    limiter.checkAi("1.1.1.1");
    assertDoesNotThrow(() -> limiter.checkSpeech("1.1.1.1"));
  }

  @Test
  void limitsShopPageEventsPerClient() {
    for (int i = 0; i < 60; i++) limiter.checkEvents("3.3.3.3");
    assertThrows(TooManyRequestsException.class, () -> limiter.checkEvents("3.3.3.3"));
  }
}
