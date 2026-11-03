package com.vaanishopai.web;

import com.vaanishopai.service.ShopService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.ZoneOffset;

/** Lets search engines find shop pages, and keeps them out of private screens. */
@RestController
public class SeoController {

  private static final int MAX_URLS = 50_000;

  private final ShopService shopService;
  private final SiteUrls urls;

  public SeoController(ShopService shopService, SiteUrls urls) {
    this.shopService = shopService;
    this.urls = urls;
  }

  @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> robots() {
    var body = """
        User-agent: *
        Disallow: /api/
        Disallow: /dashboard
        Disallow: /manage/
        Disallow: /create
        Sitemap: %s/sitemap.xml
        """.formatted(urls.base());
    return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofDays(1))).body(body);
  }

  @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
  public ResponseEntity<String> sitemap() {
    var xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
        .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n")
        .append("  <url><loc>").append(urls.base()).append("/</loc></url>\n");
    int count = 0;
    for (var row : shopService.publicSlugs()) {
      if (++count > MAX_URLS) break;
      var slug = (String) row[0];
      var created = (Instant) row[1];
      xml.append("  <url><loc>").append(urls.shop(slug)).append("</loc>");
      if (created != null) {
        xml.append("<lastmod>").append(DateTimeFormatter.ISO_LOCAL_DATE.format(created.atOffset(ZoneOffset.UTC))).append("</lastmod>");
      }
      xml.append("</url>\n");
    }
    xml.append("</urlset>\n");
    return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofHours(1))).body(xml.toString());
  }
}
