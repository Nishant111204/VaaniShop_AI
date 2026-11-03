package com.vaanishopai.dto;

import java.time.LocalDate;
import java.util.List;

/** Daily customer activity on a shop page, oldest day first. */
public record ShopStats(List<Day> days) {

  public record Day(LocalDate day, int visits, int orders, int whatsapp, int calls, int directions, int shares) {
    public static Day empty(LocalDate day) {
      return new Day(day, 0, 0, 0, 0, 0, 0);
    }
  }
}
