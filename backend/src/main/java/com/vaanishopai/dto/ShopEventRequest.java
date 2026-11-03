package com.vaanishopai.dto;

import jakarta.validation.constraints.NotBlank;

public record ShopEventRequest(@NotBlank String type) {}
