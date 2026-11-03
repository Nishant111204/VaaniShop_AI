package com.vaanishopai.repository;

import com.vaanishopai.model.Shop;
import com.vaanishopai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {
  List<Shop> findByOwnerOrderByCreatedAtDesc(User owner);
  Optional<Shop> findBySlug(String slug);
  boolean existsBySlug(String slug);

  @Query("SELECT s.slug, s.createdAt FROM Shop s WHERE s.slug IS NOT NULL ORDER BY s.createdAt DESC")
  List<Object[]> findAllSlugs();

}
