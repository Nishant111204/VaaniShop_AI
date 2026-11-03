package com.vaanishopai.service;

import com.vaanishopai.dto.ShopSchema;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Single place where shop content is cleaned before it is stored, whether it came
 * from the AI or from the owner's edit form. Nulls become "", lengths are capped and
 * fields that end up in links (phone, instagram, images) are restricted to safe shapes.
 */
public final class ShopSanitizer {

  public static final Set<String> THEMES = Set.of("green", "orange", "blue", "purple", "rose", "slate");
  public static final int MAX_PRODUCTS = 100;

  private static final Pattern IMAGE_URL = Pattern.compile("^/api/images/[0-9a-fA-F-]{36}$");
  private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static final Pattern PHONE_DISALLOWED = Pattern.compile("[^0-9+\\- ]");
  private static final Pattern INSTAGRAM_DISALLOWED = Pattern.compile("[^A-Za-z0-9._]");
  private static final Pattern ASCII_ALNUM = Pattern.compile("[A-Za-z0-9]");

  private ShopSanitizer() {}

  public static ShopSchema clean(ShopSchema s) {
    if (s == null) return empty("My Shop");
    var shopName = cap(s.shopName(), 100);
    return new ShopSchema(
        shopName.isEmpty() ? "My Shop" : shopName,
        cap(s.tagline(), 140),
        cap(s.description(), 1500),
        category(s.category()),
        cap(s.address(), 300),
        phone(s.phone()),
        phone(s.whatsapp()),
        email(s.email()),
        cap(s.timing(), 120),
        instagram(s.instagram()),
        theme(s.theme()),
        image(s.coverImage()),
        products(s.products()));
  }

  public static ShopSchema empty(String shopName) {
    return new ShopSchema(shopName, "", "", "", "", "", "", "", "", "", "slate", "", List.of());
  }

  public static ShopSchema.Product product(ShopSchema.Product p) {
    return new ShopSchema.Product(
        cap(p.name(), 100),
        cap(p.price(), 40),
        cap(p.description(), 300),
        cap(p.category(), 40),
        emoji(p.emoji()),
        image(p.image()),
        p.suggested());
  }

  private static List<ShopSchema.Product> products(List<ShopSchema.Product> in) {
    if (in == null) return List.of();
    var out = new ArrayList<ShopSchema.Product>();
    for (var p : in) {
      if (p == null) continue;
      var cleaned = product(p);
      if (cleaned.name().isEmpty()) continue;
      out.add(cleaned);
      if (out.size() >= MAX_PRODUCTS) break;
    }
    return out;
  }

  static String cap(String s, int max) {
    if (s == null) return "";
    var t = s.strip();
    return t.length() > max ? t.substring(0, max).strip() : t;
  }

  static String theme(String t) {
    var v = cap(t, 20).toLowerCase(Locale.ROOT);
    return THEMES.contains(v) ? v : "slate";
  }

  static String category(String c) {
    return cap(c, 40).toLowerCase(Locale.ROOT);
  }

  static String phone(String p) {
    return cap(PHONE_DISALLOWED.matcher(p == null ? "" : p).replaceAll(""), 20);
  }

  static String email(String e) {
    var v = cap(e, 120);
    return EMAIL.matcher(v).matches() ? v : "";
  }

  static String instagram(String handle) {
    var v = cap(handle, 120);
    v = v.replaceFirst("(?i)^https?://(www\\.)?instagram\\.com/", "").replaceFirst("^@", "");
    int slash = v.indexOf('/');
    if (slash >= 0) v = v.substring(0, slash);
    v = cap(INSTAGRAM_DISALLOWED.matcher(v).replaceAll(""), 30);
    return v.isEmpty() ? "" : "@" + v;
  }

  static String image(String url) {
    var v = cap(url, 60);
    return IMAGE_URL.matcher(v).matches() ? v : "";
  }

  static String emoji(String e) {
    var v = cap(e, 16);
    return ASCII_ALNUM.matcher(v).find() ? "" : v;
  }
}
