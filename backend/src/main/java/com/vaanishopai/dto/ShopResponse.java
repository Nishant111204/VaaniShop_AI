package com.vaanishopai.dto;

import java.time.Instant;
import java.util.UUID;

public record ShopResponse(
    UUID shopId,
    ShopSchema data,
    String slug,
    long viewCount,
    Instant createdAt
) {}
