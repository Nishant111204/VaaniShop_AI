package com.vaanishopai.controller;

import com.vaanishopai.dto.auth.AuthResponse;
import com.vaanishopai.dto.auth.LoginRequest;
import com.vaanishopai.dto.auth.RegisterRequest;
import com.vaanishopai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final UserService userService;

  public AuthController(UserService userService) {
    this.userService = userService;
  }

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
    return userService.register(req);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {
    return userService.login(req);
  }
}
