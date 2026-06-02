package com.vaanishopai.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue
  private UUID id;

  @Column(nullable = false)
  private String name;

  @Column(unique = true, nullable = false)
  private String phone;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected User() {}

  public User(String name, String phone, String passwordHash) {
    this.name = name;
    this.phone = phone;
    this.passwordHash = passwordHash;
  }

  public UUID getId() { return id; }
  public String getName() { return name; }
  public String getPhone() { return phone; }
  public String getPasswordHash() { return passwordHash; }
  public Instant getCreatedAt() { return createdAt; }
}
