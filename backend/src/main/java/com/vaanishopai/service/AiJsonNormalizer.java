package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vaanishopai.dto.ShopSchema;
import com.vaanishopai.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiJsonNormalizer {

  private final ObjectMapper objectMapper;

  public AiJsonNormalizer(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public NormalizedShop normalizeStrict(String raw) {
    var jsonText = extractLikelyJson(raw);
    final JsonNode root;
    try {
      root = objectMapper.readTree(jsonText);
    } catch (Exception e) {
      throw new BadRequestException("AI returned invalid JSON");
    }
    if (root == null || !root.isObject()) {
      throw new BadRequestException("AI returned non-object JSON");
    }

    var shopName    = text(root, "shopName",    "My Shop");
    var tagline     = text(root, "tagline",     "");
    var description = text(root, "description", "");
    var category    = text(root, "category",    "");
    var address     = text(root, "address",     "");
    var phone       = text(root, "phone",       "");
    var whatsapp    = text(root, "whatsapp",    phone);
    var email       = text(root, "email",       "");
    var timing      = text(root, "timing",      "");
    var instagram   = text(root, "instagram",   "");
    var theme       = text(root, "theme",       "slate");

    List<ShopSchema.Product> products = new ArrayList<>();
    var productsNode = root.get("products");
    if (productsNode != null && productsNode.isArray()) {
      for (JsonNode p : productsNode) {
        if (p != null && p.isObject()) {
          products.add(new ShopSchema.Product(
              text(p, "name", ""),
              text(p, "price", ""),
              text(p, "description", ""),
              text(p, "category", ""),
              text(p, "imageKeyword", "")
          ));
        }
      }
    }

    var schema = new ShopSchema(shopName, tagline, description, category, address, phone, whatsapp, email, timing, instagram, theme, products);

    ObjectNode jsonb = objectMapper.createObjectNode();
    jsonb.put("shopName", shopName);
    jsonb.put("tagline", tagline);
    jsonb.put("description", description);
    jsonb.put("category", category);
    jsonb.put("address", address);
    jsonb.put("phone", phone);
    jsonb.put("whatsapp", whatsapp);
    jsonb.put("email", email);
    jsonb.put("timing", timing);
    jsonb.put("instagram", instagram);
    jsonb.put("theme", theme);

    ArrayNode prods = objectMapper.createArrayNode();
    for (var p : products) {
      ObjectNode obj = objectMapper.createObjectNode();
      obj.put("name", p.name() == null ? "" : p.name());
      obj.put("price", p.price() == null ? "" : p.price());
      obj.put("description", p.description() == null ? "" : p.description());
      obj.put("category", p.category() == null ? "" : p.category());
      obj.put("imageKeyword", p.imageKeyword() == null ? "" : p.imageKeyword());
      prods.add(obj);
    }
    jsonb.set("products", prods);

    try {
      return new NormalizedShop(schema, objectMapper.writeValueAsString(jsonb));
    } catch (Exception e) {
      throw new BadRequestException("Failed to serialize normalized JSON");
    }
  }

  private static String text(JsonNode node, String field, String def) {
    var child = node.get(field);
    if (child == null || child.isNull()) return def;
    if (!child.isTextual()) return def;
    var v = child.asText();
    return (v == null || v.isBlank()) ? def : v;
  }

  private static String extractLikelyJson(String raw) {
    if (raw == null) return "";
    var s = raw.strip();
    if (s.startsWith("```")) {
      int firstNewline = s.indexOf('\n');
      if (firstNewline > 0) s = s.substring(firstNewline + 1);
      int lastFence = s.lastIndexOf("```");
      if (lastFence >= 0) s = s.substring(0, lastFence);
      s = s.strip();
    }
    // Find first '{' in case of leading text
    int start = s.indexOf('{');
    int end = s.lastIndexOf('}');
    if (start >= 0 && end > start) s = s.substring(start, end + 1);
    return s;
  }

  public record NormalizedShop(ShopSchema schema, String jsonbData) {}
}
