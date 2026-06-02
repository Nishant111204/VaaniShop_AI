package com.vaanishopai.controller;

import com.vaanishopai.dto.*;
import com.vaanishopai.exception.BadRequestException;
import com.vaanishopai.model.User;
import com.vaanishopai.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

  private final ShopService shopService;

  public ShopController(ShopService shopService) {
    this.shopService = shopService;
  }

  @PostMapping("/create")
  public ShopResponse create(@Valid @RequestBody ShopCreateRequest req) {
    return shopService.createFromText(req.text(), currentUser());
  }

  @PostMapping("/update")
  public ShopResponse update(@Valid @RequestBody ShopUpdateRequest req) {
    return shopService.updateFromText(req.shopId(), req.text(), currentUser());
  }

  @PutMapping("/{id}/fields")
  public ShopResponse updateFields(@PathVariable UUID id,
                                   @RequestBody ShopUpdateFieldsRequest req) {
    return shopService.updateFields(id, req, currentUser());
  }

  @GetMapping("/my")
  public List<ShopSummary> myShops() {
    return shopService.listByOwner(currentUser());
  }

  /** Authenticated owner view — no view-count increment. */
  @GetMapping("/manage/{id}")
  public ShopResponse manage(@PathVariable("id") UUID id) {
    return shopService.getOwned(id, currentUser());
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
    shopService.delete(id, currentUser());
  }

  private User currentUser() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof User user)) {
      throw new BadRequestException("Not authenticated");
    }
    return user;
  }
}
