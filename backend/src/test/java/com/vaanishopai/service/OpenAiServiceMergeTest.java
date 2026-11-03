package com.vaanishopai.service;

import com.vaanishopai.dto.ShopSchema;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OpenAiServiceMergeTest {

  private static final String RICE_IMG = "/api/images/11111111-1111-1111-1111-111111111111";
  private static final String COVER = "/api/images/22222222-2222-2222-2222-222222222222";

  private static ShopSchema shop(String cover, List<ShopSchema.Product> products) {
    return new ShopSchema("Ramesh Store", "", "", "grocery", "", "", "", "", "", "", "green", cover, products);
  }

  @Test
  void keepsPhotosOfProductsTheAiKeptOrRenamed() {
    var current = shop(COVER, List.of(
        new ShopSchema.Product("Rice", "₹60/kg", "", "Staples", "🍚", RICE_IMG, false),
        new ShopSchema.Product("Dal", "₹120/kg", "", "Staples", "🫘", "", false)));

    // AI renamed rice, removed dal, appended mango juice.
    var edited = shop("", List.of(
        new ShopSchema.Product("Basmati Rice", "₹90/kg", "", "Staples", "🍚", "", false),
        new ShopSchema.Product("Mango Juice", "₹30", "", "Drinks", "🥭", "", false)));
    var parsed = new AiJsonNormalizer.ParsedShop(edited, List.of("p0", ""), "Renamed rice, added juice");

    var result = OpenAiService.merge(current, parsed);

    assertEquals(COVER, result.schema().coverImage(), "cover photo survives edits");
    assertEquals(RICE_IMG, result.schema().products().get(0).image(), "renamed product keeps its photo");
    assertEquals("", result.schema().products().get(1).image());
    assertEquals("Renamed rice, added juice", result.summary());
  }

  @Test
  void ignoresUnknownOrMalformedRefs() {
    var current = shop("", List.of(new ShopSchema.Product("Rice", "", "", "", "", RICE_IMG, false)));
    var edited = shop("", List.of(
        new ShopSchema.Product("A", "", "", "", "", "", false),
        new ShopSchema.Product("B", "", "", "", "", "", false)));
    var parsed = new AiJsonNormalizer.ParsedShop(edited, List.of("p9", "../p0"), "");

    var result = OpenAiService.merge(current, parsed);

    assertEquals("", result.schema().products().get(0).image());
    assertEquals("", result.schema().products().get(1).image());
  }
}
