package com.vaanishopai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShopCreateRequest(
    @NotBlank(message = "text is required")
    @Size(max = 4000, message = "Description is too long (max 4000 characters)") String text
) {}

