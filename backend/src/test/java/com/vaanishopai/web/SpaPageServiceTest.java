package com.vaanishopai.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaanishopai.config.AppProperties;
import com.vaanishopai.dto.ShopResponse;
import com.vaanishopai.dto.ShopSchema;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SpaPageServiceTest {

  private final SpaPageService pages = new SpaPageService(new ObjectMapper(),
      new SiteUrls(new AppProperties(null, null, null, null, new AppProperties.Site("https://vaanishop.in/"))));

  private static ShopResponse shop(String name, String tagline, String description) {
    var d = new ShopSchema(name, tagline, description, "sweets", "Dadar West, Mumbai", "9822012345", "9822012345",
        "", "", "", "rose", "", List.of());
    return new ShopResponse(UUID.randomUUID(), d, "ganesh-sweets", 0, Instant.now(), null);
  }

  @Test
  void injectsShopPreviewTags() {
    var html = pages.shop(shop("Ganesh Sweets", "Fresh mithai daily", "Sweets since 1980.")).getBody();
    assertTrue(html.contains("<title>Ganesh Sweets | Fresh mithai daily</title>"));
    assertTrue(html.contains("<meta property=\"og:url\" content=\"https://vaanishop.in/s/ganesh-sweets\">"));
    assertTrue(html.contains("content=\"https://vaanishop.in/og/ganesh-sweets.png?v="));
    assertTrue(html.contains("<meta name=\"theme-color\" content=\"#E2507A\">"), "theme colour follows the shop");
    assertEquals(1, count(html, "<title>"), "the app's default title is replaced, not duplicated");
    assertEquals(1, count(html, "name=\"description\""));
    assertTrue(html.contains("\"@type\":\"Store\""));
  }

  @Test
  void shopTextCannotBreakOutOfTheHtml() {
    var html = pages.shop(shop("Evil \"><script>alert(1)</script>", "</script><img src=x onerror=alert(1)>", "a & b")).getBody();
    assertFalse(html.contains("<script>alert(1)"), "names are escaped in attributes and titles");
    assertFalse(html.contains("<img src=x"), "taglines are escaped");
    assertEquals(1, count(html, "</script>"), "only the JSON-LD block closes a script element");
    assertTrue(html.contains("\\u003c/script\\u003e"), "JSON-LD escapes angle brackets");
  }

  @Test
  void missingShopIsNotIndexed() {
    var res = pages.missingShop();
    assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
    assertTrue(res.getBody().contains("noindex"));
  }

  @Test
  void summaryFallsBackAndTruncates() {
    var empty = shop("X", "", "").data();
    assertTrue(SpaPageService.summary(empty).startsWith("See our price list"));
    var longText = shop("X", "", "a".repeat(500)).data();
    assertTrue(SpaPageService.summary(longText).length() <= 300);
  }

  private static int count(String s, String needle) {
    int n = 0;
    for (int i = s.indexOf(needle); i >= 0; i = s.indexOf(needle, i + 1)) n++;
    return n;
  }
}
