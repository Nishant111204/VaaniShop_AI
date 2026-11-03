package com.vaanishopai.web;

import com.vaanishopai.exception.NotFoundException;
import com.vaanishopai.service.ShopService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
public class OgImageController {

  private final OgImageService images;
  private final ShopService shopService;

  public OgImageController(OgImageService images, ShopService shopService) {
    this.images = images;
    this.shopService = shopService;
  }

  /** The URL carries ?v=<version>, so a changed shop gets a new URL and old cards can be cached. */
  @GetMapping(value = "/og/{slug}.png", produces = MediaType.IMAGE_PNG_VALUE)
  public ResponseEntity<byte[]> card(@PathVariable String slug) {
    var shop = shopService.peekBySlug(slug).orElseThrow(() -> new NotFoundException("Shop not found"));
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
        .body(images.render(slug, shop.data()));
  }
}
