package com.vaanishopai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaanishopai.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AiJsonNormalizerTest {

  private final AiJsonNormalizer normalizer = new AiJsonNormalizer(new ObjectMapper());

  @Test
  void parsesFullShopAndKeepsProductRefs() {
    var parsed = normalizer.normalize("""
        {"shopName":"Ramesh General Store","tagline":"Fresh staples daily","category":"Grocery",
         "phone":"9876543210","theme":"green","summary":"Changed timing",
         "products":[{"ref":"p0","name":"Rice","price":"₹60/kg","emoji":"🍚","suggested":false},
                     {"ref":"","name":"Sugar","price":"₹45/kg","emoji":"🍬","suggested":true}]}
        """);
    var s = parsed.schema();
    assertEquals("Ramesh General Store", s.shopName());
    assertEquals("grocery", s.category());
    assertEquals("9876543210", s.whatsapp(), "whatsapp falls back to phone");
    assertEquals(2, s.products().size());
    assertTrue(s.products().get(1).suggested());
    assertEquals(java.util.List.of("p0", ""), parsed.productRefs());
    assertEquals("Changed timing", parsed.summary());
  }

  @Test
  void loneWhatsappNumberAlsoBecomesThePhone() {
    var s = normalizer.normalize("{\"shopName\":\"X\",\"phone\":\"\",\"whatsapp\":\"9822012345\"}").schema();
    assertEquals("9822012345", s.phone());
    assertEquals("9822012345", s.whatsapp());
  }

  @Test
  void convertsNumericPricesToRupeeStrings() {
    var s = normalizer.normalize("""
        {"shopName":"X","products":[{"name":"Dal","price":120},{"name":"Oil","price":149.50}]}
        """).schema();
    assertEquals("₹120", s.products().get(0).price());
    assertEquals("₹149.5", s.products().get(1).price());
  }

  @Test
  void stripsCodeFencesAndLeadingText() {
    var s = normalizer.normalize("Here you go:\n```json\n{\"shopName\":\"Bakery\"}\n```").schema();
    assertEquals("Bakery", s.shopName());
  }

  @Test
  void fallsBackForUnknownThemeAndWordEmoji() {
    var s = normalizer.normalize("""
        {"shopName":"X","theme":"neon","products":[{"name":"Bread","emoji":"bread"}]}
        """).schema();
    assertEquals("slate", s.theme());
    assertEquals("", s.products().get(0).emoji());
  }

  @Test
  void skipsNamelessProductsWithoutMisaligningRefs() {
    var parsed = normalizer.normalize("""
        {"shopName":"X","products":[{"ref":"p0","name":""},{"ref":"p1","name":"Milk"}]}
        """);
    assertEquals(1, parsed.schema().products().size());
    assertEquals(java.util.List.of("p1"), parsed.productRefs());
  }

  @Test
  void rejectsNonJson() {
    assertThrows(BadRequestException.class, () -> normalizer.normalize("sorry, I can't"));
  }
}
