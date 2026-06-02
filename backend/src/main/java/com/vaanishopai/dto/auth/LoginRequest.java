package com.vaanishopai.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank String phone,
    @NotBlank String password
) {}
