package com.vaanishopai.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaanishopai.dto.ShopResponse;
import com.vaanishopai.dto.ShopSchema;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serves the built single-page app. Shop pages get their own title, description,
 * preview image and business details in the HTML, because WhatsApp, Google and
 * other crawlers read those without running JavaScript.
 */
@Service
public class SpaPageService {

  private static final Pattern TITLE = Pattern.compile("<title>.*?</title>", Pattern.DOTALL);
  private static final Pattern DESCRIPTION = Pattern.compile("<meta name=\"description\"[^>]*>");
  private static final Pattern THEME_COLOR = Pattern.compile("<meta name=\"theme-color\"[^>]*>");
  private static final Map<String, String> AWNING = Map.of(
      "green", "#2E9A5F", "orange", "#F07D1E", "blue", "#2F6BE0",
      "purple", "#8E4CCB", "rose", "#E2507A", "slate", "#4A5875");

  private static final String NOT_BUILT = """
      <!doctype html><meta charset="utf-8"><title>VaaniShop API</title>
      <p>The VaaniShop frontend is not bundled in this build. In development, run the Vite
      dev server (<code>cd frontend &amp;&amp; npm run dev</code>) and open it instead.</p>""";

  private final ObjectMapper objectMapper;
  private final SiteUrls urls;
  private volatile String indexHtml;

  public SpaPageService(ObjectMapper objectMapper, SiteUrls urls) {
    this.objectMapper = objectMapper;
    this.urls = urls;
  }

  public ResponseEntity<String> app(HttpStatus status) {
    return html(status, index());
  }

  public ResponseEntity<String> shop(ShopResponse shop) {
    var d = shop.data();
    var url = urls.shop(shop.slug());
    var title = d.tagline().isBlank() ? d.shopName() : d.shopName() + " | " + d.tagline();
    var description = summary(d);
    var image = urls.base() + "/og/" + shop.slug() + ".png?v=" + OgImageService.version(d);

    var head = new StringBuilder()
        .append("<title>").append(esc(title)).append("</title>\n")
        .append(meta("name", "description", description))
        .append("<link rel=\"canonical\" href=\"").append(esc(url)).append("\">\n")
        .append(meta("property", "og:type", "website"))
        .append(meta("property", "og:site_name", "VaaniShop"))
        .append(meta("property", "og:title", d.shopName()))
        .append(meta("property", "og:description", description))
        .append(meta("property", "og:url", url))
        .append(meta("property", "og:image", image))
        .append(meta("property", "og:image:width", "1200"))
        .append(meta("property", "og:image:height", "630"))
        .append(meta("property", "og:image:alt", d.shopName()))
        .append(meta("name", "twitter:card", "summary_large_image"))
        .append("<script type=\"application/ld+json\">").append(jsonLd(d, url, image)).append("</script>\n");

    var html = index();
    html = TITLE.matcher(html).replaceFirst("");
    html = DESCRIPTION.matcher(html).replaceFirst("");
    html = THEME_COLOR.matcher(html).replaceFirst(Matcher.quoteReplacement(
        "<meta name=\"theme-color\" content=\"" + AWNING.getOrDefault(d.theme(), "#4A5875") + "\">"));
    html = html.replace("</head>", head + "</head>");
    return html(HttpStatus.OK, html);
  }

  /** Unknown shop: the app shows its "not here" page; search engines are told not to index it. */
  public ResponseEntity<String> missingShop() {
    var html = index().replace("</head>", "<meta name=\"robots\" content=\"noindex\">\n</head>");
    return html(HttpStatus.NOT_FOUND, html);
  }

  static String summary(ShopSchema d) {
    var text = !d.description().isBlank() ? d.description() : d.tagline();
    if (text.isBlank()) text = "See our price list and order on WhatsApp.";
    if (!d.address().isBlank()) text = text + " " + d.address() + ".";
    return text.length() > 300 ? text.substring(0, 297).strip() + "…" : text;
  }

  private String jsonLd(ShopSchema d, String url, String image) {
    var ld = new LinkedHashMap<String, Object>();
    ld.put("@context", "https://schema.org");
    ld.put("@type", "Store");
    ld.put("name", d.shopName());
    if (!d.description().isBlank()) ld.put("description", d.description());
    ld.put("url", url);
    ld.put("image", image);
    if (!d.phone().isBlank()) ld.put("telephone", d.phone());
    if (!d.address().isBlank()) {
      ld.put("address", Map.of("@type", "PostalAddress", "streetAddress", d.address(), "addressCountry", "IN"));
    }
    try {
      // Escape "<" so shop text can never close the script element.
      return objectMapper.writeValueAsString(ld).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026");
    } catch (Exception e) {
      return "{}";
    }
  }

  private static String meta(String attr, String key, String value) {
    return "<meta " + attr + "=\"" + key + "\" content=\"" + esc(value) + "\">\n";
  }

  private static String esc(String s) {
    return HtmlUtils.htmlEscape(s == null ? "" : s, StandardCharsets.UTF_8.name());
  }

  private String index() {
    var cached = indexHtml;
    if (cached != null) return cached;
    var resource = new ClassPathResource("static/index.html");
    if (!resource.exists()) return NOT_BUILT;
    try (var in = resource.getInputStream()) {
      indexHtml = new String(in.readAllBytes(), StandardCharsets.UTF_8);
      return indexHtml;
    } catch (IOException e) {
      return NOT_BUILT;
    }
  }

  private static ResponseEntity<String> html(HttpStatus status, String body) {
    return ResponseEntity.status(status)
        .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
        .cacheControl(CacheControl.noCache())
        .body(body);
  }
}
