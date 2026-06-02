package com.vaanishopai.security;

import com.vaanishopai.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private final UserRepository userRepo;

  public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepo) {
    this.jwtUtil = jwtUtil;
    this.userRepo = userRepo;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain chain) throws ServletException, IOException {
    var header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      var token = header.substring(7);
      try {
        var phone = jwtUtil.getPhone(token);
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
          userRepo.findByPhone(phone).ifPresent(user -> {
            var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
          });
        }
      } catch (Exception ignored) {}
    }
    chain.doFilter(request, response);
  }
}
