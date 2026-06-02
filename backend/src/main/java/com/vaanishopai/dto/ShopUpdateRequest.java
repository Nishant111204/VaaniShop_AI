package com.vaanishopai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ShopUpdateRequest(
    @NotNull(message = "shopId is required") UUID shopId,
    @NotBlank(message = "text is required") String text
) {}

