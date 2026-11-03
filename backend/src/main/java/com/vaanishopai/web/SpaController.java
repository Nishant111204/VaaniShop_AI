package com.vaanishopai.web;

import com.vaanishopai.service.ShopService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

/** Routes handled by the React app. Static files (/assets, icons) are served by Spring directly. */
@Controller
public class SpaController {

  private final SpaPageService pages;
  private final ShopService shopService;

  public SpaController(SpaPageService pages, ShopService shopService) {
    this.pages = pages;
    this.shopService = shopService;
  }

  @GetMapping(value = {"/", "/create", "/login", "/register", "/dashboard", "/manage/{id}", "/manage/{id}/poster"},
      produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> app() {
    return pages.app(HttpStatus.OK);
  }

  @GetMapping(value = "/s/{slug}", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> shop(@PathVariable String slug) {
    return shopService.peekBySlug(slug).map(pages::shop).orElseGet(pages::missingShop);
  }

  @GetMapping(value = "/shop/{id}", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> shopById(@PathVariable String id) {
    try {
      return shopService.peek(UUID.fromString(id))
          .filter(s -> s.slug() != null)
          .map(pages::shop)
          .orElseGet(pages::missingShop);
    } catch (IllegalArgumentException e) {
      return pages.missingShop();
    }
  }
}
