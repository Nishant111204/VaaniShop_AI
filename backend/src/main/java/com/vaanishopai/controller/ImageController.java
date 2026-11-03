package com.vaanishopai.controller;

import com.vaanishopai.service.ImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
public class ImageController {

  private final ImageService imageService;

  public ImageController(ImageService imageService) {
    this.imageService = imageService;
  }

  /** Images are immutable (a new upload gets a new id), so they can be cached forever. */
  @GetMapping("/{id}")
  public ResponseEntity<byte[]> get(@PathVariable UUID id) {
    var image = imageService.get(id);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.getContentType()))
        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
        .header("Content-Security-Policy", "default-src 'none'")
        .body(image.getData());
  }
}
