package com.vaanishopai.dto;

import java.time.Instant;
import java.util.UUID;

public record ShopSummary(
    UUID shopId,
    String shopName,
    String category,
    String description,
    String tagline,
    String theme,
    String coverImage,
    int productCount,
    String slug,
    long viewCount,
    int visitsLast7Days,
    int ordersLast7Days,
    Instant createdAt
) {}
