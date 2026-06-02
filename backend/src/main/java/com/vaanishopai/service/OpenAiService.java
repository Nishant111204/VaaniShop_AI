package com.vaanishopai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vaanishopai.config.AppProperties;
import com.vaanishopai.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Service
public class OpenAiService {

  private static final Logger log = LoggerFactory.getLogger(OpenAiService.class);
  private static final String GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

  private static final String SYSTEM_PROMPT = """
You are a data extraction engine for shopkeepers. Extract ALL business details from the user's voice description and return ONLY valid JSON — no markdown, no code fences, no extra text.

STRICT OUTPUT SCHEMA (include ALL keys; use "" for unknown strings, [] for unknown arrays):
{
  "shopName": "",
  "description": "",
  "category": "",
  "address": "",
  "phone": "",
  "whatsapp": "",
  "email": "",
  "timing": "",
  "instagram": "",
  "theme": "",
  "products": []
}

Field rules:
- shopName: The official business/shop name
- description: 1-2 sentence summary of what the shop sells or does
- category: ONE lowercase word — grocery, bakery, pharmacy, electronics, clothing, restaurant, salon, hardware, dairy, stationery, mobile, jewellery, or similar
- address: Full address with locality/area if mentioned
- phone: Primary phone/mobile number (with country code if given, else as-is)
- whatsapp: WhatsApp number — same as phone if not stated separately
- email: Email address if mentioned, else ""
- timing: Business hours as a string e.g. "9am–9pm Mon–Sat" or "Open 24 hours"
- instagram: Instagram handle if mentioned (e.g. @mybakery), else ""
- theme: Pick ONE color that fits the business — green (grocery/nature/pharmacy), orange (restaurant/food/bakery), blue (electronics/services/repair), purple (salon/fashion/beauty), rose (flowers/gifts/jewellery), slate (general/hardware/other)
- products: Array of objects with keys: name (string), price (string with currency symbol e.g. ₹50 or $5), description (string), category (string). Include every product, service, or item mentioned.

Output ONLY the JSON object. Nothing else.
""";

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

  public AiJsonNormalizer.NormalizedShop extractShopFromText(String text) {
    if (props.groq().apiKey() == null || props.groq().apiKey().isBlank()) {
      throw new BadRequestException("GROQ_API_KEY is not set");
    }

    Exception last = null;
    for (int attempt = 1; attempt <= 2; attempt++) {
      try {
        String content = callGroq(text);
        return normalizer.normalizeStrict(content);
      } catch (WebClientResponseException e) {
        last = e;
        log.warn("Groq chat call failed (status {}) attempt {}/2", e.getStatusCode().value(), attempt);
      } catch (Exception e) {
        last = e;
        log.warn("Groq chat call failed attempt {}/2", attempt, e);
      }
    }
    throw new BadRequestException("Failed to process text via AI" + (last != null ? ": " + last.getMessage() : ""));
  }

  private String callGroq(String text) throws Exception {
    ObjectNode body = objectMapper.createObjectNode();
    body.put("model", props.groq().chatModel());

    ArrayNode messages = objectMapper.createArrayNode();
    messages.add(msg("system", SYSTEM_PROMPT));
    messages.add(msg("user", "Voice transcript:\n" + text));
    body.set("messages", messages);

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
}
