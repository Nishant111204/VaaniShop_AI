package com.vaanishopai.service;

import com.vaanishopai.dto.auth.AuthResponse;
import com.vaanishopai.dto.auth.LoginRequest;
import com.vaanishopai.dto.auth.RegisterRequest;
import com.vaanishopai.exception.BadRequestException;
import com.vaanishopai.model.User;
import com.vaanishopai.repository.UserRepository;
import com.vaanishopai.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

  private final UserRepository userRepo;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  public UserService(UserRepository userRepo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
  }

  @Transactional
  public AuthResponse register(RegisterRequest req) {
    if (userRepo.existsByPhone(req.phone())) {
      throw new BadRequestException("Phone number already registered");
    }
    var user = new User(req.name().trim(), req.phone(), passwordEncoder.encode(req.password()));
    var saved = userRepo.save(user);
    var token = jwtUtil.generate(saved.getId(), saved.getPhone());
    return new AuthResponse(token, saved.getId(), saved.getName(), saved.getPhone());
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest req) {
    var user = userRepo.findByPhone(req.phone())
        .orElseThrow(() -> new BadRequestException("Invalid phone or password"));
    if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
      throw new BadRequestException("Invalid phone or password");
    }
    var token = jwtUtil.generate(user.getId(), user.getPhone());
    return new AuthResponse(token, user.getId(), user.getName(), user.getPhone());
  }
}
