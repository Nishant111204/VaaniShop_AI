package com.vaanishopai.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** A product or cover photo uploaded by a shop owner. Deleted together with its shop. */
@Entity
@Table(name = "shop_images")
public class ShopImage {

  @Id
  @GeneratedValue
  private UUID id;

  @Column(name = "shop_id", nullable = false)
  private UUID shopId;

  @Column(name = "content_type", nullable = false)
  private String contentType;

  @Column(name = "data", nullable = false)
  private byte[] data;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected ShopImage() {}

  public ShopImage(UUID shopId, String contentType, byte[] data) {
    this.shopId = shopId;
    this.contentType = contentType;
    this.data = data;
  }

  public UUID getId() { return id; }
  public UUID getShopId() { return shopId; }
  public String getContentType() { return contentType; }
  public byte[] getData() { return data; }
  public Instant getCreatedAt() { return createdAt; }
}
