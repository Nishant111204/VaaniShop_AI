package com.vaanishopai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ShopUpdateRequest(
    @NotNull(message = "shopId is required") UUID shopId,
    @NotBlank(message = "text is required")
    @Size(max = 2000, message = "Instruction is too long (max 2000 characters)") String text
) {}

