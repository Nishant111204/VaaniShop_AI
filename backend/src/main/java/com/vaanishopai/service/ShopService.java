package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vaanishopai.dto.ShopResponse;
import com.vaanishopai.dto.ShopSchema;
import com.vaanishopai.dto.ShopSummary;
import com.vaanishopai.dto.ShopUpdateFieldsRequest;
import com.vaanishopai.exception.BadRequestException;
import com.vaanishopai.exception.NotFoundException;
import com.vaanishopai.model.Shop;
import com.vaanishopai.model.User;
import com.vaanishopai.repository.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ShopService {

  private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");

  private final ShopRepository repo;
  private final OpenAiService openAiService;
  private final ObjectMapper objectMapper;

  public ShopService(ShopRepository repo, OpenAiService openAiService, ObjectMapper objectMapper) {
    this.repo = repo;
    this.openAiService = openAiService;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public ShopResponse createFromText(String text, User owner) {
    var normalized = openAiService.extractShopFromText(text);
    var schema = normalized.schema();
    var shop = new Shop(schema.shopName(), schema.category(), normalized.jsonbData(), owner);
    shop.setSlug(generateUniqueSlug(schema.shopName()));
    var saved = repo.save(shop);
    return toResponse(saved, schema);
  }

  @Transactional
  public ShopResponse updateFromText(UUID shopId, String text, User owner) {
    var shop = findOwned(shopId, owner);
    var normalized = openAiService.extractShopFromText(text);
    var schema = normalized.schema();
    shop.setShopName(schema.shopName());
    shop.setCategory(schema.category());
    shop.setData(normalized.jsonbData());
    if (shop.getSlug() == null) {
      shop.setSlug(generateUniqueSlug(schema.shopName()));
    }
    var saved = repo.save(shop);
    return toResponse(saved, schema);
  }

  @Transactional
  public ShopResponse updateFields(UUID shopId, ShopUpdateFieldsRequest req, User owner) {
    var shop = findOwned(shopId, owner);
    var schema = new ShopSchema(
        orDefault(req.shopName(), shop.getShopName()),
        "",
        orDefault(req.description(), ""),
        orDefault(req.category(), shop.getCategory()),
        orDefault(req.address(), ""),
        orDefault(req.phone(), ""),
        orDefault(req.whatsapp(), ""),
        orDefault(req.email(), ""),
        orDefault(req.timing(), ""),
        orDefault(req.instagram(), ""),
        orDefault(req.theme(), ""),
        req.products() != null ? req.products() : List.of()
    );
    var jsonb = schemaToJsonb(schema);
    shop.setShopName(schema.shopName());
    shop.setCategory(schema.category());
    shop.setData(jsonb);
    if (shop.getSlug() == null) {
      shop.setSlug(generateUniqueSlug(schema.shopName()));
    }
    var saved = repo.save(shop);
    return toResponse(saved, schema);
  }

  @Transactional
  public ShopResponse getAndTrackView(UUID shopId) {
    var shop = repo.findById(shopId).orElseThrow(() -> new NotFoundException("Shop not found"));
    repo.incrementViewCount(shopId);
    var schema = toSchema(shop.getShopName(), shop.getData());
    return toResponse(shop, schema);
  }

  @Transactional
  public ShopResponse getBySlugAndTrackView(String slug) {
    var shop = repo.findBySlug(slug).orElseThrow(() -> new NotFoundException("Shop not found"));
    repo.incrementViewCount(shop.getId());
    var schema = toSchema(shop.getShopName(), shop.getData());
    return toResponse(shop, schema);
  }

  @Transactional(readOnly = true)
  public ShopResponse getOwned(UUID shopId, User owner) {
    var shop = findOwned(shopId, owner);
    var schema = toSchema(shop.getShopName(), shop.getData());
    return toResponse(shop, schema);
  }

  @Transactional(readOnly = true)
  public List<ShopSummary> listByOwner(User owner) {
    return repo.findByOwnerOrderByCreatedAtDesc(owner).stream()
        .map(s -> new ShopSummary(
            s.getId(),
            s.getShopName(),
            s.getCategory(),
            extractDescription(s.getData()),
            s.getSlug(),
            s.getViewCount(),
            s.getCreatedAt()))
        .toList();
  }

  @Transactional
  public void delete(UUID shopId, User owner) {
    var shop = findOwned(shopId, owner);
    repo.delete(shop);
  }

  private Shop findOwned(UUID shopId, User owner) {
    var shop = repo.findById(shopId).orElseThrow(() -> new NotFoundException("Shop not found"));
    if (shop.getOwner() == null || !shop.getOwner().getId().equals(owner.getId())) {
      throw new BadRequestException("You do not own this shop");
    }
    return shop;
  }

  private String generateUniqueSlug(String shopName) {
    String base = slugify(shopName);
    if (base.isBlank()) base = "shop";
    String candidate = base;
    int suffix = 2;
    while (repo.existsBySlug(candidate)) {
      candidate = base + "-" + suffix++;
    }
    return candidate;
  }

  private static String slugify(String input) {
    if (input == null) return "";
    String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
        .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return NON_ALPHANUMERIC.matcher(normalized.toLowerCase(Locale.ROOT)).replaceAll("-")
        .replaceAll("^-+|-+$", "");
  }

  private String extractDescription(String jsonb) {
    try {
      var node = objectMapper.readTree(jsonb);
      var d = node.get("description");
      return d != null && d.isTextual() ? d.asText() : "";
    } catch (Exception e) {
      return "";
    }
  }

  private ShopSchema toSchema(String shopName, String jsonb) {
    try {
      JsonNode node = objectMapper.readTree(jsonb);
      if (node == null || !node.isObject()) node = objectMapper.createObjectNode();
      ObjectNode root = (ObjectNode) node;
      root.put("shopName", shopName == null ? "My Shop" : shopName);
      return objectMapper.treeToValue(root, ShopSchema.class);
    } catch (Exception e) {
      return new ShopSchema(shopName == null ? "My Shop" : shopName, "", "", "", "", "", "", "", "", "", "", List.of());
    }
  }

  private String schemaToJsonb(ShopSchema schema) {
    try {
      ObjectNode jsonb = objectMapper.createObjectNode();
      jsonb.put("description", nullToEmpty(schema.description()));
      jsonb.put("category", nullToEmpty(schema.category()));
      jsonb.put("address", nullToEmpty(schema.address()));
      jsonb.put("phone", nullToEmpty(schema.phone()));
      jsonb.put("whatsapp", nullToEmpty(schema.whatsapp()));
      jsonb.put("email", nullToEmpty(schema.email()));
      jsonb.put("timing", nullToEmpty(schema.timing()));
      jsonb.put("instagram", nullToEmpty(schema.instagram()));
      jsonb.put("theme", nullToEmpty(schema.theme()));
      ArrayNode prods = objectMapper.createArrayNode();
      if (schema.products() != null) {
        for (var p : schema.products()) {
          ObjectNode obj = objectMapper.createObjectNode();
          obj.put("name", nullToEmpty(p.name()));
          obj.put("price", nullToEmpty(p.price()));
          obj.put("description", nullToEmpty(p.description()));
          obj.put("category", nullToEmpty(p.category()));
          prods.add(obj);
        }
      }
      jsonb.set("products", prods);
      return objectMapper.writeValueAsString(jsonb);
    } catch (Exception e) {
      throw new BadRequestException("Failed to serialize shop data");
    }
  }

  private ShopResponse toResponse(Shop shop, ShopSchema schema) {
    return new ShopResponse(shop.getId(), schema, shop.getSlug(), shop.getViewCount(), shop.getCreatedAt());
  }

  private static String orDefault(String value, String fallback) {
    return (value != null) ? value : (fallback != null ? fallback : "");
  }

  private static String nullToEmpty(String s) {
    return s != null ? s : "";
  }
}
