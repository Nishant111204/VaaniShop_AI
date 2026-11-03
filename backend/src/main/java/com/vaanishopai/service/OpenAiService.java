package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vaanishopai.config.AppProperties;
import com.vaanishopai.dto.ShopSchema;
import com.vaanishopai.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/** Talks to Groq's OpenAI-compatible chat API to write and edit shop websites. */
@Service
public class OpenAiService {

  private static final Logger log = LoggerFactory.getLogger(OpenAiService.class);
  private static final String GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

  private static final String SHOP_KEYS = """
{
  "shopName": "", "tagline": "", "description": "", "category": "",
  "address": "", "phone": "", "whatsapp": "", "email": "", "timing": "",
  "instagram": "", "theme": "",
  "products": [{"name": "", "price": "", "description": "", "category": "", "emoji": "", "suggested": false}]
}""";

  private static final String FIELD_RULES = """
Field rules:
- Facts the shopkeeper stated (names, prices, phone numbers, address, timings) must be kept exactly. NEVER invent a phone number, WhatsApp number, email, address or Instagram handle; use "" when not given.
- Write customer-facing text (tagline, description, product descriptions) in simple, warm English unless the shopkeeper asks for another language. Write shop and product names in Latin script, transliterating if needed (e.g. "Ganesh Mithai Bhandar").
- tagline: at most 8 words, specific to this shop.
- description: 2-3 sentences on what they offer, what makes them special and why customers should visit.
- category: one lowercase word, e.g. grocery, bakery, sweets, pharmacy, electronics, mobile, clothing, tailor, footwear, restaurant, cafe, salon, beauty, hardware, dairy, stationery, jewellery, florist, gifts, services.
- timing: formatted like "8:00 AM – 10:00 PM, Mon–Sat" or "Open 24 hours".
- address: the location as stated, even if it is only an area and city (e.g. "Kothrud, Pune").
- phone, whatsapp: digits as spoken, keep +91 if given. If only one number is given, use it for both.
- theme: exactly one of green (grocery, dairy, pharmacy, organic), orange (food, bakery, sweets, restaurant, cafe), blue (electronics, mobile, repair, services), purple (salon, beauty, fashion, clothing), rose (flowers, gifts, jewellery), slate (hardware, anything else).
- products[].price: a string with ₹ and the unit if any, e.g. "₹60/kg", "₹150 per litre", "₹250–₹400".
- products[].category: a short group name shared by similar items, e.g. "Staples", "Snacks", "Hair care".
- products[].emoji: ONE emoji that literally depicts the item (rice 🍚, dal 🫘, oil 🛢️, milk 🥛, bread 🍞, cake 🎂, phone 📱, charger 🔌, haircut 💇, saree 👗, medicine 💊).
""";

  private static final String CREATE_PROMPT = """
You write websites for small Indian shops. A shopkeeper described their business by voice; the transcript may be in Hindi, Marathi, Hinglish, Tamil or another language and may contain transcription mistakes. Turn it into a complete, attractive shop profile.

Return ONLY a JSON object with exactly these keys:
""" + SHOP_KEYS + """


""" + FIELD_RULES + """
- shopName: as stated; if no name is given, create a fitting one.
- timing: if not stated, use typical hours for this kind of shop.
- products: include every item or service mentioned, with "suggested": false. If fewer than 5 are mentioned, add typical items this kind of shop sells until there are 6, with realistic Indian prices and "suggested": true.
""";

  private static final String UPDATE_PROMPT = """
You edit an existing small-shop website. You receive CURRENT_SHOP as JSON and an INSTRUCTION the shopkeeper spoke (possibly in Hindi, Marathi, Hinglish or another language, possibly with transcription mistakes).

Apply ONLY what the instruction asks. Every other field and every other product must stay exactly the same, in the same order.
- Each existing product has a "ref". Keep the ref unchanged on products you keep or modify. New products get "ref": "".
- Adding an item: append it with a short description, category, emoji and "suggested": false.
- Removing an item: leave it out. Changing an item: edit only that item.
- If the instruction gives new information ("we also sell X", "closed on Sunday"), work it into the right field.

Return ONLY a JSON object with the same keys as CURRENT_SHOP (including each product's "ref"), plus "summary": one short English sentence saying what you changed, e.g. "Changed timing to 10:00 AM – 8:00 PM".

""" + FIELD_RULES;

  private final AppProperties props;
  private final WebClient webClient;
  private final ObjectMapper objectMapper;
  private final AiJsonNormalizer normalizer;

  public OpenAiService(AppProperties props, WebClient webClient, ObjectMapper objectMapper, AiJsonNormalizer normalizer) {
    this.props = props;
    this.webClient = webClient;
    this.objectMapper = objectMapper;
    this.normalizer = normalizer;
  }

  /** Builds a brand-new shop from the shopkeeper's description. */
  public ShopSchema generateShop(String description) {
    return call(CREATE_PROMPT, "Voice transcript:\n" + description, 0.7).schema();
  }

  /**
   * Applies a spoken change to an existing shop. Photos are not sent to the AI;
   * they are carried over to the edited products by ref afterwards.
   */
  public ShopEdit applyChange(ShopSchema current, String instruction) {
    var currentJson = objectMapper.createObjectNode();
    currentJson.put("shopName", current.shopName());
    currentJson.put("tagline", current.tagline());
    currentJson.put("description", current.description());
    currentJson.put("category", current.category());
    currentJson.put("address", current.address());
    currentJson.put("phone", current.phone());
    currentJson.put("whatsapp", current.whatsapp());
    currentJson.put("email", current.email());
    currentJson.put("timing", current.timing());
    currentJson.put("instagram", current.instagram());
    currentJson.put("theme", current.theme());
    ArrayNode prods = currentJson.putArray("products");
    var currentProducts = current.products() == null ? List.<ShopSchema.Product>of() : current.products();
    for (int i = 0; i < currentProducts.size(); i++) {
      var p = currentProducts.get(i);
      prods.addObject()
          .put("ref", "p" + i)
          .put("name", p.name())
          .put("price", p.price())
          .put("description", p.description())
          .put("category", p.category())
          .put("emoji", p.emoji())
          .put("suggested", p.suggested());
    }

    var parsed = call(UPDATE_PROMPT, "CURRENT_SHOP:\n" + currentJson + "\n\nINSTRUCTION:\n" + instruction, 0.2);
    return merge(current, parsed);
  }

  /** Combines the AI's edit with the parts the AI never sees: product photos and the cover photo. */
  static ShopEdit merge(ShopSchema current, AiJsonNormalizer.ParsedShop parsed) {
    var currentProducts = current.products() == null ? List.<ShopSchema.Product>of() : current.products();
    var edited = parsed.schema();
    var products = new ArrayList<ShopSchema.Product>();
    for (int i = 0; i < edited.products().size(); i++) {
      var p = edited.products().get(i);
      var original = original(currentProducts, parsed.productRefs().get(i));
      var image = original != null ? original.image() : "";
      products.add(new ShopSchema.Product(p.name(), p.price(), p.description(), p.category(), p.emoji(), image, p.suggested()));
    }

    var merged = new ShopSchema(edited.shopName(), edited.tagline(), edited.description(), edited.category(),
        edited.address(), edited.phone(), edited.whatsapp(), edited.email(), edited.timing(), edited.instagram(),
        edited.theme(), current.coverImage(), products);
    return new ShopEdit(ShopSanitizer.clean(merged), parsed.summary());
  }

  private static ShopSchema.Product original(List<ShopSchema.Product> products, String ref) {
    if (ref == null || !ref.matches("p\\d{1,3}")) return null;
    int idx = Integer.parseInt(ref.substring(1));
    return idx < products.size() ? products.get(idx) : null;
  }

  private AiJsonNormalizer.ParsedShop call(String system, String user, double temperature) {
    if (props.groq().apiKey() == null || props.groq().apiKey().isBlank()) {
      throw new BadRequestException("GROQ_API_KEY is not set");
    }

    Exception last = null;
    for (int attempt = 1; attempt <= 2; attempt++) {
      try {
        return normalizer.normalize(callGroq(system, user, temperature));
      } catch (WebClientResponseException e) {
        last = e;
        log.warn("Groq chat call failed (status {}) attempt {}/2: {}", e.getStatusCode().value(), attempt,
            e.getResponseBodyAsString());
      } catch (Exception e) {
        last = e;
        log.warn("Groq chat call failed attempt {}/2", attempt, e);
      }
    }
    log.error("AI processing failed after retries", last);
    throw new BadRequestException("Our AI couldn't process that right now. Please try again in a moment.");
  }

  private String callGroq(String system, String user, double temperature) {
    ObjectNode body = objectMapper.createObjectNode();
    body.put("model", props.groq().chatModel());
    body.put("temperature", temperature);
    body.putObject("response_format").put("type", "json_object");
    var effort = props.groq().reasoningEffort();
    if (effort != null && !effort.isBlank()) body.put("reasoning_effort", effort);

    ArrayNode messages = body.putArray("messages");
    messages.add(msg("system", system));
    messages.add(msg("user", user));

    JsonNode resp = webClient.post()
        .uri(GROQ_CHAT_URL)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.groq().apiKey())
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .bodyValue(body)
        .retrieve()
        .bodyToMono(JsonNode.class)
        .timeout(Duration.ofMillis(Math.max(1000, props.groq().timeoutMs())))
        .block();

    if (resp == null) throw new BadRequestException("Empty response from AI");
    JsonNode content = resp.at("/choices/0/message/content");
    if (content == null || content.isMissingNode() || !content.isTextual()) {
      throw new BadRequestException("Unexpected AI response format");
    }
    return content.asText();
  }

  private ObjectNode msg(String role, String content) {
    ObjectNode n = objectMapper.createObjectNode();
    n.put("role", role);
    n.put("content", content);
    return n;
  }

  public record ShopEdit(ShopSchema schema, String summary) {}
}
