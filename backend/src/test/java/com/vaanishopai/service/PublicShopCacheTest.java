package com.vaanishopai.service;

import com.vaanishopai.dto.ShopResponse;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class PublicShopCacheTest {

  private final PublicShopCache cache = new PublicShopCache();
  private final UUID id = UUID.randomUUID();
  private final ShopResponse shop = new ShopResponse(id, null, "ganesh-sweets", 0, Instant.now(), null);

  @Test
  void loadsOnceThenServesFromMemory() {
    var loads = new AtomicInteger();
    for (int i = 0; i < 5; i++) {
      assertEquals(Optional.of(shop), cache.bySlug("ganesh-sweets", () -> { loads.incrementAndGet(); return Optional.of(shop); }));
    }
    assertEquals(1, loads.get());
  }

  @Test
  void evictionForcesAFreshLoad() {
    var loads = new AtomicInteger();
    cache.bySlug("ganesh-sweets", () -> { loads.incrementAndGet(); return Optional.of(shop); });
    cache.evict(id, "ganesh-sweets");
    cache.bySlug("ganesh-sweets", () -> { loads.incrementAndGet(); return Optional.of(shop); });
    assertEquals(2, loads.get());
  }

  @Test
  void doesNotRememberMissingShops() {
    var loads = new AtomicInteger();
    cache.bySlug("nope", () -> { loads.incrementAndGet(); return Optional.empty(); });
    cache.bySlug("nope", () -> { loads.incrementAndGet(); return Optional.empty(); });
    assertEquals(2, loads.get(), "a shop published right after a miss must show up at once");
  }
}
