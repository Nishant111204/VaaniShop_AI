package com.vaanishopai.security;

import com.vaanishopai.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

  private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

  private final SecretKey key;
  private final long expirationMs;

  public JwtUtil(AppProperties props) {
    var secret = props.jwt().secret();
    if (secret == null || secret.isBlank()) {
      // Never fall back to a fixed secret: it would be public in the repo, letting anyone
      // sign tokens. A random key is safe; sessions just end when the server restarts.
      log.warn("JWT_SECRET is not set. Using a random key, so everyone is signed out on restart. "
          + "Set JWT_SECRET to a long random value in production.");
      this.key = Jwts.SIG.HS256.key().build();
    } else if (secret.length() < 32) {
      throw new IllegalStateException("JWT secret must be at least 32 characters");
    } else {
      this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }
    this.expirationMs = props.jwt().expirationMs();
  }

  public String generate(UUID userId, String phone) {
    return Jwts.builder()
        .subject(phone)
        .claim("userId", userId.toString())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + expirationMs))
        .signWith(key)
        .compact();
  }

  public Claims parse(String token) {
    return Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public String getPhone(String token) {
    return parse(token).getSubject();
  }

  public UUID getUserId(String token) {
    return UUID.fromString((String) parse(token).get("userId"));
  }
}
