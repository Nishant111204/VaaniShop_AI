package com.vaanishopai.dto;

import java.util.List;

public record ShopUpdateFieldsRequest(
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
    List<ShopSchema.Product> products
) {}
