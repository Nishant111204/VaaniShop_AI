package com.vaanishopai.service;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class StatsServiceBufferTest {

  /** Records statements instead of running them; can simulate the database being down. */
  static class FakeJdbc extends JdbcTemplate {
    final List<List<Object>> calls = new ArrayList<>();
    boolean down;

    @Override
    public int update(String sql, Object... args) {
      if (down) throw new DataAccessResourceFailureException("down");
      var call = new ArrayList<>();
      call.add(sql);
      call.addAll(Arrays.asList(args));
      calls.add(call);
      return 1;
    }

    List<Object> find(String fragment) {
      return calls.stream().filter(c -> ((String) c.get(0)).contains(fragment)).findFirst().orElse(null);
    }
  }

  private final FakeJdbc jdbc = new FakeJdbc();
  private final StatsService stats = new StatsService(jdbc);
  private final UUID shop = UUID.randomUUID();

  @Test
  void countsAreBatchedIntoOneWritePerCounter() {
    for (int i = 0; i < 5; i++) stats.record(shop, StatsService.Event.VISIT);
    stats.record(shop, StatsService.Event.ORDER);
    assertTrue(jdbc.calls.isEmpty(), "recording never touches the database");

    stats.flush();

    assertEquals(3, jdbc.calls.size());
    assertEquals(5L, jdbc.find("visits").get(3), "five visits become one +5 write");
    assertEquals(5L, jdbc.find("view_count").get(1));
    assertEquals(1L, jdbc.find("orders").get(3));
    assertEquals(0, stats.pendingCount(shop, StatsService.Event.VISIT));
  }

  @Test
  void nothingToWriteMeansNoQueries() {
    stats.flush();
    assertTrue(jdbc.calls.isEmpty());
  }

  @Test
  void countsSurviveADatabaseOutage() {
    stats.record(shop, StatsService.Event.CALL);
    stats.record(shop, StatsService.Event.CALL);
    jdbc.down = true;
    stats.flush();
    assertEquals(2, stats.pendingCount(shop, StatsService.Event.CALL));

    jdbc.down = false;
    stats.flush();
    assertEquals(2L, jdbc.find("calls").get(3));
  }
}
