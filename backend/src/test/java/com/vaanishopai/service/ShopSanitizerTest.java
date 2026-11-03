package com.vaanishopai.service;

import com.vaanishopai.dto.ShopSchema;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ShopSanitizerTest {

  private static ShopSchema shop(String instagram, String email, String cover, List<ShopSchema.Product> products) {
    return new ShopSchema("  Shop  ", null, null, "Grocery", null, "+91 98765-43210<script>", null, email,
        null, instagram, "GREEN", cover, products);
  }

  @Test
  void normalisesNullsAndCase() {
    var s = ShopSanitizer.clean(shop(null, null, null, null));
    assertEquals("Shop", s.shopName());
    assertEquals("", s.tagline());
    assertEquals("grocery", s.category());
    assertEquals("green", s.theme());
    assertEquals("+91 98765-43210", s.phone());
    assertEquals(List.of(), s.products());
  }

  @Test
  void blankNameBecomesDefault() {
    var s = ShopSanitizer.clean(new ShopSchema(" ", null, null, null, null, null, null, null, null, null, null, null, null));
    assertEquals("My Shop", s.shopName());
  }

  @Test
  void cleansInstagramHandles() {
    assertEquals("@my.bakery", ShopSanitizer.instagram("https://www.instagram.com/my.bakery/?hl=en"));
    assertEquals("@my_shop", ShopSanitizer.instagram("@my_shop"));
    assertEquals("", ShopSanitizer.instagram("@"));
  }

  @Test
  void rejectsInvalidEmail() {
    assertEquals("", ShopSanitizer.email("not-an-email"));
    assertEquals("a@b.in", ShopSanitizer.email("a@b.in"));
  }

  @Test
  void onlyAllowsOwnImageUrls() {
    var ok = "/api/images/123e4567-e89b-12d3-a456-426614174000";
    assertEquals(ok, ShopSanitizer.image(ok));
    assertEquals("", ShopSanitizer.image("https://evil.example/x.png"));
    assertEquals("", ShopSanitizer.image("javascript:alert(1)"));
  }

  @Test
  void dropsNamelessProductsAndCapsCount() {
    var products = new ArrayList<ShopSchema.Product>();
    products.add(new ShopSchema.Product("", "₹1", "", "", "", "", false));
    for (int i = 0; i < 150; i++) products.add(new ShopSchema.Product("Item " + i, "", "", "", "", "", false));
    var s = ShopSanitizer.clean(shop(null, null, null, products));
    assertEquals(ShopSanitizer.MAX_PRODUCTS, s.products().size());
    assertEquals("Item 0", s.products().get(0).name());
  }

  @Test
  void capsLongText() {
    assertEquals(5, ShopSanitizer.cap("abcdefgh", 5).length());
  }
}
