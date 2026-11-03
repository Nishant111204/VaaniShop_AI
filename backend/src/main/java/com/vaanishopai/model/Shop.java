package com.vaanishopai.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shops")
public class Shop {

  @Id
  @GeneratedValue
  private UUID id;

  @Column(name = "shop_name", nullable = false)
  private String shopName;

  @Column(name = "category")
  private String category;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "data", nullable = false, columnDefinition = "jsonb")
  private String data;

  @Column(name = "slug", unique = true)
  private String slug;

  /** Only ever incremented in SQL (StatsService); never written back from the entity. */
  @Column(name = "view_count", nullable = false, updatable = false)
  private long viewCount = 0;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owner_id")
  private User owner;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Shop() {}

  public Shop(String shopName, String category, String data, User owner) {
    this.shopName = shopName;
    this.category = category;
    this.data = data;
    this.owner = owner;
  }

  public UUID getId() { return id; }
  public String getShopName() { return shopName; }
  public void setShopName(String shopName) { this.shopName = shopName; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public String getData() { return data; }
  public void setData(String data) { this.data = data; }
  public String getSlug() { return slug; }
  public void setSlug(String slug) { this.slug = slug; }
  public long getViewCount() { return viewCount; }
  public User getOwner() { return owner; }
  public void setOwner(User owner) { this.owner = owner; }
  public Instant getCreatedAt() { return createdAt; }
}
