package com.vaanishopai.service;

import com.vaanishopai.dto.ShopStats;
import com.vaanishopai.exception.BadRequestException;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Daily counters of what customers do on a shop page. Days are Indian Standard Time,
 * since that is when the shop's day starts and ends.
 */
@Service
public class StatsService {

  private static final Logger log = LoggerFactory.getLogger(StatsService.class);

  static final ZoneId SHOP_ZONE = ZoneId.of("Asia/Kolkata");

  /** Customer actions the page reports, mapped to their (fixed, trusted) column names. */
  public enum Event {
    VISIT("visits"), ORDER("orders"), WHATSAPP("whatsapp"), CALL("calls"), DIRECTIONS("directions"), SHARE("shares");

    final String column;

    Event(String column) { this.column = column; }

    public static Event parse(String s) {
      if (s != null) {
        for (var e : values()) if (e != VISIT && e.name().equalsIgnoreCase(s)) return e;
      }
      throw new BadRequestException("Unknown event type");
    }
  }

  private record Key(UUID shopId, LocalDate day, Event event) {}

  private final JdbcTemplate jdbc;
  /** Counts not yet written. Flushed in batches so counting never slows a page down. */
  private final ConcurrentHashMap<Key, AtomicLong> pending = new ConcurrentHashMap<>();

  public StatsService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void record(UUID shopId, Event event) {
    pending.computeIfAbsent(new Key(shopId, today(), event), k -> new AtomicLong()).incrementAndGet();
  }

  /**
   * Writes buffered counts. Visits also bump the shop's all-time view count. Counts for
   * shops deleted in the meantime are dropped; on a database error they are kept for
   * the next run.
   */
  @Scheduled(fixedDelayString = "${app.stats.flush-ms:10000}")
  @PreDestroy
  public synchronized void flush() {
    var today = today();
    for (var entry : pending.entrySet()) {
      var key = entry.getKey();
      var counter = entry.getValue();
      long n = counter.getAndSet(0);
      if (n > 0) {
        try {
          write(key, n);
        } catch (DataAccessException e) {
          counter.addAndGet(n);
          log.warn("Could not save shop stats; will retry", e);
          return;
        }
      }
      if (key.day().isBefore(today) && counter.get() == 0) pending.remove(key, counter);
    }
  }

  private void write(Key key, long n) {
    var col = key.event().column;
    // The column comes from the enum above, never from the request. EXISTS skips shops
    // deleted since the count was taken instead of failing on the foreign key.
    jdbc.update("INSERT INTO shop_daily_stats (shop_id, day, " + col + ") SELECT ?, ?, ? "
            + "WHERE EXISTS (SELECT 1 FROM shops WHERE id = ?) "
            + "ON CONFLICT (shop_id, day) DO UPDATE SET " + col + " = shop_daily_stats." + col + " + EXCLUDED." + col,
        key.shopId(), Date.valueOf(key.day()), n, key.shopId());
    if (key.event() == Event.VISIT) {
      jdbc.update("UPDATE shops SET view_count = view_count + ? WHERE id = ?", n, key.shopId());
    }
  }

  long pendingCount(UUID shopId, Event event) {
    var c = pending.get(new Key(shopId, today(), event));
    return c == null ? 0 : c.get();
  }

  /** One entry per day for the last {@code days} days, oldest first, including empty days. */
  public ShopStats forShop(UUID shopId, int days) {
    var to = today();
    var from = to.minusDays(days - 1L);
    var rows = new HashMap<LocalDate, ShopStats.Day>();
    jdbc.query("SELECT day, visits, orders, whatsapp, calls, directions, shares FROM shop_daily_stats "
            + "WHERE shop_id = ? AND day BETWEEN ? AND ?",
        rs -> {
          var day = rs.getDate("day").toLocalDate();
          rows.put(day, new ShopStats.Day(day, rs.getInt("visits"), rs.getInt("orders"), rs.getInt("whatsapp"),
              rs.getInt("calls"), rs.getInt("directions"), rs.getInt("shares")));
        },
        shopId, Date.valueOf(from), Date.valueOf(to));
    var series = new ArrayList<ShopStats.Day>();
    for (var d = from; !d.isAfter(to); d = d.plusDays(1)) {
      series.add(rows.getOrDefault(d, ShopStats.Day.empty(d)));
    }
    return new ShopStats(series);
  }

  /** Last-7-day visits and WhatsApp orders per shop, for the dashboard: {visits, orders}. */
  public Map<UUID, int[]> lastWeek(Collection<UUID> shopIds) {
    var out = new LinkedHashMap<UUID, int[]>();
    if (shopIds.isEmpty()) return out;
    var ids = shopIds.toArray(new UUID[0]);
    jdbc.query(con -> {
      var ps = con.prepareStatement("SELECT shop_id, SUM(visits) v, SUM(orders) o FROM shop_daily_stats "
          + "WHERE shop_id = ANY (?) AND day >= ? GROUP BY shop_id");
      ps.setArray(1, con.createArrayOf("uuid", ids));
      ps.setDate(2, Date.valueOf(today().minusDays(6)));
      return ps;
    }, rs -> {
      out.put((UUID) rs.getObject("shop_id"), new int[] {rs.getInt("v"), rs.getInt("o")});
    });
    return out;
  }

  static LocalDate today() {
    return LocalDate.now(SHOP_ZONE);
  }

  public static List<String> eventNames() {
    return List.of("order", "whatsapp", "call", "directions", "share");
  }
}
