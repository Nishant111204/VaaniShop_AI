package com.vaanishopai.dto;

import java.util.List;

public record ShopSchema(
    String shopName,
    String description,
    String category,
    String address,
    String phone,
    String whatsapp,
    String email,
    String timing,
    String instagram,
    String theme,
    List<Product> products) {
  public record Product(String name, String price, String description, String category) {
  }
}
