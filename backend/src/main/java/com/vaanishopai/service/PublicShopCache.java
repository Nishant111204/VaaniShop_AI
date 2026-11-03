package com.vaanishopai.service;

import com.vaanishopai.dto.ShopResponse;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Keeps public shop data in memory briefly, so a link shared to a WhatsApp group
 * doesn't send every visitor to the database. Saves and deletes evict immediately;
 * the expiry only matters when several servers share one database.
 */
@Component
public class PublicShopCache {

  static final long TTL_MS = 60_000;
  private static final int MAX_ENTRIES = 5_000;

  private record Entry(ShopResponse shop, long expiresAt) {}

  private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();

  public Optional<ShopResponse> bySlug(String slug, Supplier<Optional<ShopResponse>> load) {
    return get("s:" + slug, load);
  }

  public Optional<ShopResponse> byId(UUID id, Supplier<Optional<ShopResponse>> load) {
    return get("i:" + id, load);
  }

  /** Evicts now and again after the surrounding transaction commits, so a read racing the save can't re-cache old data. */
  public void evict(UUID id, String slug) {
    Runnable remove = () -> {
      entries.remove("i:" + id);
      if (slug != null) entries.remove("s:" + slug);
    };
    remove.run();
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override public void afterCommit() { remove.run(); }
      });
    }
  }

  private Optional<ShopResponse> get(String key, Supplier<Optional<ShopResponse>> load) {
    long now = System.currentTimeMillis();
    var hit = entries.get(key);
    if (hit != null && hit.expiresAt() > now) return Optional.of(hit.shop());
    var loaded = load.get();
    if (loaded.isPresent()) {
      if (entries.size() >= MAX_ENTRIES) entries.values().removeIf(e -> e.expiresAt() <= now);
      if (entries.size() < MAX_ENTRIES) entries.put(key, new Entry(loaded.get(), now + TTL_MS));
    } else {
      entries.remove(key);
    }
    return loaded;
  }
}
