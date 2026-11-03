package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vaanishopai.dto.ShopResponse;
import com.vaanishopai.dto.ShopSchema;
import com.vaanishopai.dto.ShopSummary;
import com.vaanishopai.exception.BadRequestException;
import com.vaanishopai.exception.ForbiddenException;
import com.vaanishopai.exception.NotFoundException;
import com.vaanishopai.model.Shop;
import com.vaanishopai.model.User;
import com.vaanishopai.repository.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
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

  /** Builds a shop from a description without saving it, so visitors can preview before signing up. */
  public ShopSchema generateDraft(String text) {
    return openAiService.generateShop(text);
  }

  /** Saves a (possibly edited) draft as a new shop owned by {@code owner}. */
  @Transactional
  public ShopResponse publish(ShopSchema draft, User owner) {
    var schema = withoutImages(ShopSanitizer.clean(draft));
    var shop = new Shop(schema.shopName(), schema.category(), toJsonb(schema), owner);
    shop.setSlug(generateUniqueSlug(schema.shopName()));
    return toResponse(repo.save(shop), schema, null);
  }

  @Transactional
  public ShopResponse createFromText(String text, User owner) {
    return publish(openAiService.generateShop(text), owner);
  }

  @Transactional
  public ShopResponse updateFromText(UUID shopId, String text, User owner) {
    var shop = requireOwned(shopId, owner);
    var edit = openAiService.applyChange(toSchema(shop), text);
    return save(shop, edit.schema(), edit.summary());
  }

  @Transactional
  public ShopResponse updateFields(UUID shopId, ShopSchema fields, User owner) {
    var shop = requireOwned(shopId, owner);
    return save(shop, ShopSanitizer.clean(fields), null);
  }

  @Transactional
  public ShopResponse getAndTrackView(UUID shopId) {
    var shop = repo.findById(shopId).orElseThrow(() -> new NotFoundException("Shop not found"));
    repo.incrementViewCount(shopId);
    return toResponse(shop, toSchema(shop), null);
  }

  @Transactional
  public ShopResponse getBySlugAndTrackView(String slug) {
    var shop = repo.findBySlug(slug).orElseThrow(() -> new NotFoundException("Shop not found"));
    repo.incrementViewCount(shop.getId());
    return toResponse(shop, toSchema(shop), null);
  }

  /** For link previews: crawlers should not count as visits. */
  @Transactional(readOnly = true)
  public Optional<ShopResponse> peekBySlug(String slug) {
    return repo.findBySlug(slug).map(shop -> toResponse(shop, toSchema(shop), null));
  }

  @Transactional(readOnly = true)
  public Optional<ShopResponse> peek(UUID shopId) {
    return repo.findById(shopId).map(shop -> toResponse(shop, toSchema(shop), null));
  }

  @Transactional(readOnly = true)
  public List<Object[]> publicSlugs() {
    return repo.findAllSlugs();
  }

  @Transactional(readOnly = true)
  public ShopResponse getOwned(UUID shopId, User owner) {
    var shop = requireOwned(shopId, owner);
    return toResponse(shop, toSchema(shop), null);
  }

  @Transactional(readOnly = true)
  public List<ShopSummary> listByOwner(User owner) {
    return repo.findByOwnerOrderByCreatedAtDesc(owner).stream()
        .map(s -> {
          var schema = toSchema(s);
          return new ShopSummary(
              s.getId(),
              s.getShopName(),
              s.getCategory(),
              schema.description(),
              schema.tagline(),
              schema.theme(),
              schema.coverImage(),
              schema.products().size(),
              s.getSlug(),
              s.getViewCount(),
              s.getCreatedAt());
        })
        .toList();
  }

  @Transactional
  public void delete(UUID shopId, User owner) {
    repo.delete(requireOwned(shopId, owner));
  }

  public Shop requireOwned(UUID shopId, User owner) {
    var shop = repo.findById(shopId).orElseThrow(() -> new NotFoundException("Shop not found"));
    if (shop.getOwner() == null || !shop.getOwner().getId().equals(owner.getId())) {
      throw new ForbiddenException("You do not own this shop");
    }
    return shop;
  }

  private ShopResponse save(Shop shop, ShopSchema schema, String changeSummary) {
    shop.setShopName(schema.shopName());
    shop.setCategory(schema.category());
    shop.setData(toJsonb(schema));
    if (shop.getSlug() == null) {
      shop.setSlug(generateUniqueSlug(schema.shopName()));
    }
    return toResponse(repo.save(shop), schema, changeSummary);
  }

  /** A draft has no shop yet, so it cannot own uploaded photos. */
  private static ShopSchema withoutImages(ShopSchema s) {
    var products = s.products().stream()
        .map(p -> new ShopSchema.Product(p.name(), p.price(), p.description(), p.category(), p.emoji(), "", p.suggested()))
        .toList();
    return new ShopSchema(s.shopName(), s.tagline(), s.description(), s.category(), s.address(), s.phone(),
        s.whatsapp(), s.email(), s.timing(), s.instagram(), s.theme(), "", products);
  }

  private String generateUniqueSlug(String shopName) {
    String base = slugify(shopName);
    if (base.isBlank()) base = "shop";
    if (base.length() > 60) base = base.substring(0, 60).replaceAll("-+$", "");
    String candidate = base;
    int suffix = 2;
    while (repo.existsBySlug(candidate)) {
      candidate = base + "-" + suffix++;
    }
    return candidate;
  }

  static String slugify(String input) {
    if (input == null) return "";
    String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
        .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return NON_ALPHANUMERIC.matcher(normalized.toLowerCase(Locale.ROOT)).replaceAll("-")
        .replaceAll("^-+|-+$", "");
  }

  private ShopSchema toSchema(Shop shop) {
    var shopName = shop.getShopName() == null ? "My Shop" : shop.getShopName();
    try {
      JsonNode node = objectMapper.readTree(shop.getData());
      if (node == null || !node.isObject()) return ShopSanitizer.empty(shopName);
      ((ObjectNode) node).put("shopName", shopName);
      return ShopSanitizer.clean(objectMapper.treeToValue(node, ShopSchema.class));
    } catch (Exception e) {
      return ShopSanitizer.empty(shopName);
    }
  }

  private String toJsonb(ShopSchema schema) {
    try {
      return objectMapper.writeValueAsString(schema);
    } catch (Exception e) {
      throw new BadRequestException("Failed to serialize shop data");
    }
  }

  private ShopResponse toResponse(Shop shop, ShopSchema schema, String changeSummary) {
    return new ShopResponse(shop.getId(), schema, shop.getSlug(), shop.getViewCount(), shop.getCreatedAt(),
        changeSummary);
  }
}
