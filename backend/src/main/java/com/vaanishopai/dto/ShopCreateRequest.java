package com.vaanishopai.dto;

import jakarta.validation.constraints.NotBlank;

public record ShopCreateRequest(
    @NotBlank(message = "text is required") String text
) {}

