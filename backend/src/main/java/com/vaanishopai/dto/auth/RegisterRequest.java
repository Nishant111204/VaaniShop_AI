package com.vaanishopai.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank String name,
    @NotBlank @Pattern(regexp = "\\d{10,15}", message = "Phone must be 10-15 digits") String phone,
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password
) {}
