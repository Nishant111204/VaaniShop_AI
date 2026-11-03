package com.vaanishopai.config;

import com.vaanishopai.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final AppProperties appProperties;

  public SecurityConfig(JwtAuthFilter jwtAuthFilter, AppProperties appProperties) {
    this.jwtAuthFilter = jwtAuthFilter;
    this.appProperties = appProperties;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /**
   * The app is self-contained: scripts and styles from this origin, Google Fonts, Google
   * Maps for the shop map, and data/blob URLs for QR codes and photo previews.
   */
  static final String CONTENT_SECURITY_POLICY = String.join("; ",
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self'",
      "frame-src https://maps.google.com https://www.google.com",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'");

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/shop/my").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/shop/{id}").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/shop/s/{slug}").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/images/{id}").permitAll()
            // Visitors can try the voice builder before signing up; both are rate limited per IP.
            .requestMatchers(HttpMethod.POST, "/api/shop/generate").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/speech/transcribe").permitAll()
            .requestMatchers("/api/**").authenticated()
            .requestMatchers("/actuator/health", "/actuator/info").permitAll()
            .requestMatchers("/actuator/**").denyAll()
            // Everything else is the web app itself: pages, static files, previews, sitemap.
            .anyRequest().permitAll()
        )
        .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
        .headers(h -> h
            .contentSecurityPolicy(csp -> csp.policyDirectives(CONTENT_SECURITY_POLICY))
            .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            // The microphone and camera (for product photos) are only ever used by this site.
            .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy",
                "microphone=(self), camera=(self), geolocation=(), payment=(), usb=()")))
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    var origins = Arrays.asList(appProperties.cors().allowedOrigins().split(","));
    config.setAllowedOrigins(origins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
