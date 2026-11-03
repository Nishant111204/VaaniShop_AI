package com.vaanishopai.repository;

import com.vaanishopai.model.ShopImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ShopImageRepository extends JpaRepository<ShopImage, UUID> {
  long countByShopId(UUID shopId);
}
