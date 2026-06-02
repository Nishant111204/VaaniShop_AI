package com.vaanishopai.repository;

import com.vaanishopai.model.Shop;
import com.vaanishopai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {
  List<Shop> findByOwnerOrderByCreatedAtDesc(User owner);
  Optional<Shop> findBySlug(String slug);
  boolean existsBySlug(String slug);

  @Modifying
  @Query("UPDATE Shop s SET s.viewCount = s.viewCount + 1 WHERE s.id = :id")
  void incrementViewCount(@Param("id") UUID id);
}
