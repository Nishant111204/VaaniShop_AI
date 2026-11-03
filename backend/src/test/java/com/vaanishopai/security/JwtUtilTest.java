package com.vaanishopai.security;

import com.vaanishopai.config.AppProperties;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

  private static JwtUtil withSecret(String secret) {
    return new JwtUtil(new AppProperties(null, new AppProperties.Jwt(secret, 60_000), null, null, null));
  }

  @Test
  void missingSecretUsesAKeyNobodyElseHas() {
    var a = withSecret("");
    var b = withSecret(null);
    var token = a.generate(UUID.randomUUID(), "9876543210");
    assertEquals("9876543210", a.getPhone(token));
    assertThrows(Exception.class, () -> b.getPhone(token), "a second instance must not accept the first one's tokens");
  }

  @Test
  void configuredSecretIsStableAcrossInstances() {
    var secret = "x".repeat(40);
    var token = withSecret(secret).generate(UUID.randomUUID(), "9876543210");
    assertEquals("9876543210", withSecret(secret).getPhone(token));
  }

  @Test
  void rejectsShortSecrets() {
    assertThrows(IllegalStateException.class, () -> withSecret("too-short"));
  }
}
