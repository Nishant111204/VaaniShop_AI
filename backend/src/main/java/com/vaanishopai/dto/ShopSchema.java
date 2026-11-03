package com.vaanishopai.dto;

import java.util.List;

/**
 * The full content of a shop website. Stored as JSONB and returned to the frontend as-is.
 * Image fields hold relative URLs of uploaded photos ("/api/images/{uuid}") or "".
 */
public record ShopSchema(
    String shopName,
    String tagline,
    String description,
    String category,
    String address,
    String phone,
    String whatsapp,
    String email,
    String timing,
    String instagram,
    String theme,
    String coverImage,
    List<Product> products) {

  /** {@code suggested} marks items the AI added on its own, so the owner can review them. */
  public record Product(
      String name,
      String price,
      String description,
      String category,
      String emoji,
      String image,
      boolean suggested) {
  }
}
