package com.vaanishopai.service;

import com.vaanishopai.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StatsServiceTest {

  @Test
  void parsesTheEventsPagesSend() {
    for (var name : StatsService.eventNames()) {
      assertNotNull(StatsService.Event.parse(name));
    }
    assertEquals(StatsService.Event.ORDER, StatsService.Event.parse("ORDER"));
  }

  @Test
  void visitsCannotBeReportedByPages() {
    assertThrows(BadRequestException.class, () -> StatsService.Event.parse("visit"));
  }

  @Test
  void rejectsAnythingElse() {
    assertThrows(BadRequestException.class, () -> StatsService.Event.parse("orders = 999 --"));
    assertThrows(BadRequestException.class, () -> StatsService.Event.parse(null));
  }

  @Test
  void daysFollowIndianTime() {
    assertEquals("Asia/Kolkata", StatsService.SHOP_ZONE.getId());
  }
}
