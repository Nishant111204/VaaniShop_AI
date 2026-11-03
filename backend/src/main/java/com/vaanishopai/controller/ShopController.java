package com.vaanishopai.controller;

import com.vaanishopai.dto.*;
import com.vaanishopai.security.CurrentUser;
import com.vaanishopai.service.ImageService;
import com.vaanishopai.service.RateLimitService;
import com.vaanishopai.service.ShopService;
import com.vaanishopai.service.StatsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

  private final ShopService shopService;
  private final ImageService imageService;
  private final RateLimitService rateLimitService;

  public ShopController(ShopService shopService, ImageService imageService, RateLimitService rateLimitService) {
    this.shopService = shopService;
    this.imageService = imageService;
    this.rateLimitService = rateLimitService;
  }

  /** Public: turns a description into a shop preview without saving anything. */
  @PostMapping("/generate")
  public ShopSchema generate(@Valid @RequestBody ShopCreateRequest req, HttpServletRequest request) {
    rateLimitService.checkAi(request.getRemoteAddr());
    return shopService.generateDraft(req.text());
  }

  /** Saves a previewed draft as a new shop. */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ShopResponse publish(@RequestBody ShopSchema draft) {
    return shopService.publish(draft, CurrentUser.require());
  }

  @PostMapping("/create")
  public ShopResponse create(@Valid @RequestBody ShopCreateRequest req) {
    var user = CurrentUser.require();
    rateLimitService.checkAi(user.getId().toString());
    return shopService.createFromText(req.text(), user);
  }

  @PostMapping("/update")
  public ShopResponse update(@Valid @RequestBody ShopUpdateRequest req) {
    var user = CurrentUser.require();
    rateLimitService.checkAi(user.getId().toString());
    return shopService.updateFromText(req.shopId(), req.text(), user);
  }

  @PutMapping("/{id}/fields")
  public ShopResponse updateFields(@PathVariable UUID id, @RequestBody ShopSchema fields) {
    return shopService.updateFields(id, fields, CurrentUser.require());
  }

  @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public ImageUploadResponse uploadImage(@PathVariable UUID id, @RequestPart("image") MultipartFile image) {
    return imageService.upload(id, image, CurrentUser.require());
  }

  /** Public: a customer tapped Order, WhatsApp, Call, Directions or Share on a shop page. */
  @PostMapping("/{id}/events")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void event(@PathVariable UUID id, @Valid @RequestBody ShopEventRequest req, HttpServletRequest request) {
    rateLimitService.checkEvents(request.getRemoteAddr());
    shopService.recordEvent(id, StatsService.Event.parse(req.type()));
  }

  @GetMapping("/{id}/stats")
  public ShopStats stats(@PathVariable UUID id, @RequestParam(defaultValue = "30") int days) {
    return shopService.stats(id, days, CurrentUser.require());
  }

  @GetMapping("/my")
  public List<ShopSummary> myShops() {
    return shopService.listByOwner(CurrentUser.require());
  }

  /** Authenticated owner view — no view-count increment. */
  @GetMapping("/manage/{id}")
  public ShopResponse manage(@PathVariable("id") UUID id) {
    return shopService.getOwned(id, CurrentUser.require());
  }

  /** Public view — increments view count. */
  @GetMapping("/{id}")
  public ShopResponse get(@PathVariable("id") UUID id) {
    return shopService.getAndTrackView(id);
  }

  /** Public slug-based view — increments view count. */
  @GetMapping("/s/{slug}")
  public ShopResponse getBySlug(@PathVariable("slug") String slug) {
    return shopService.getBySlugAndTrackView(slug);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    shopService.delete(id, CurrentUser.require());
  }
}
