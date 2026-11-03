package com.vaanishopai.dto;

import java.time.Instant;
import java.util.UUID;

/** {@code changeSummary} is set only after a voice edit, describing what the AI changed. */
public record ShopResponse(
    UUID shopId,
    ShopSchema data,
    String slug,
    long viewCount,
    Instant createdAt,
    String changeSummary
) {}
