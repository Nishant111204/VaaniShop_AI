package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaanishopai.dto.ShopSchema;
import com.vaanishopai.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Turns the AI's raw text reply into a sanitized {@link ShopSchema}. */
@Component
public class AiJsonNormalizer {

  private final ObjectMapper objectMapper;

  public AiJsonNormalizer(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public ParsedShop normalize(String raw) {
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

    var phone = text(root, "phone", "");
    List<ShopSchema.Product> products = new ArrayList<>();
    List<String> refs = new ArrayList<>();
    var productsNode = root.get("products");
    if (productsNode != null && productsNode.isArray()) {
      for (JsonNode p : productsNode) {
        if (p == null || !p.isObject()) continue;
        var product = ShopSanitizer.product(new ShopSchema.Product(
            text(p, "name", ""),
            price(p.get("price")),
            text(p, "description", ""),
            text(p, "category", ""),
            text(p, "emoji", ""),
            "",
            p.path("suggested").asBoolean(false)));
        if (product.name().isEmpty()) continue;
        products.add(product);
        refs.add(text(p, "ref", ""));
      }
    }

    var schema = ShopSanitizer.clean(new ShopSchema(
        text(root, "shopName", "My Shop"),
        text(root, "tagline", ""),
        text(root, "description", ""),
        text(root, "category", ""),
        text(root, "address", ""),
        phone,
        text(root, "whatsapp", phone),
        text(root, "email", ""),
        text(root, "timing", ""),
        text(root, "instagram", ""),
        text(root, "theme", "slate"),
        "",
        products));

    // clean() drops nameless products, which were already skipped above, so refs stay aligned.
    return new ParsedShop(schema, refs, text(root, "summary", ""));
  }

  private static String text(JsonNode node, String field, String def) {
    var child = node.get(field);
    if (child == null || child.isNull()) return def;
    if (!child.isTextual() && !child.isNumber()) return def;
    var v = child.asText();
    return v.isBlank() ? def : v;
  }

  /** Prices should be strings like "₹60/kg", but models sometimes return bare numbers. */
  private static String price(JsonNode node) {
    if (node == null || node.isNull()) return "";
    if (node.isNumber()) return "₹" + new BigDecimal(node.asText()).stripTrailingZeros().toPlainString();
    return node.isTextual() ? node.asText() : "";
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

  /**
   * @param productRefs for each product, the "ref" the AI echoed back ("" for new items);
   *                    used to carry photos across voice edits
   * @param summary     the AI's one-line description of what it changed (updates only)
   */
  public record ParsedShop(ShopSchema schema, List<String> productRefs, String summary) {}
}
