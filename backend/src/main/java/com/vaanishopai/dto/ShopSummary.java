package com.vaanishopai.dto;

import java.time.Instant;
import java.util.UUID;

public record ShopSummary(
    UUID shopId,
    String shopName,
    String category,
    String description,
    String slug,
    long viewCount,
    Instant createdAt
) {}
