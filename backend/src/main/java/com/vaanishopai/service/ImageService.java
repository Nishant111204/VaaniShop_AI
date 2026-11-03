package com.vaanishopai.service;

import com.vaanishopai.dto.ImageUploadResponse;
import com.vaanishopai.exception.BadRequestException;
import com.vaanishopai.exception.NotFoundException;
import com.vaanishopai.model.ShopImage;
import com.vaanishopai.model.User;
import com.vaanishopai.repository.ShopImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class ImageService {

  static final long MAX_BYTES = 3 * 1024 * 1024;
  static final int MAX_IMAGES_PER_SHOP = 120;

  private final ShopImageRepository repo;
  private final ShopService shopService;

  public ImageService(ShopImageRepository repo, ShopService shopService) {
    this.repo = repo;
    this.shopService = shopService;
  }

  @Transactional
  public ImageUploadResponse upload(UUID shopId, MultipartFile file, User owner) {
    shopService.requireOwned(shopId, owner);
    if (file == null || file.isEmpty()) throw new BadRequestException("image is required");
    if (file.getSize() > MAX_BYTES) throw new BadRequestException("Image too large (max 3MB)");
    if (repo.countByShopId(shopId) >= MAX_IMAGES_PER_SHOP) {
      throw new BadRequestException("This shop has reached its photo limit");
    }
    final byte[] bytes;
    try {
      bytes = file.getBytes();
    } catch (IOException e) {
      throw new BadRequestException("Could not read image");
    }
    var contentType = detectContentType(bytes);
    if (contentType == null) throw new BadRequestException("Only JPEG, PNG or WebP images are allowed");

    var saved = repo.save(new ShopImage(shopId, contentType, bytes));
    return new ImageUploadResponse(saved.getId(), "/api/images/" + saved.getId());
  }

  @Transactional(readOnly = true)
  public ShopImage get(UUID imageId) {
    return repo.findById(imageId).orElseThrow(() -> new NotFoundException("Image not found"));
  }

  /** Identifies the image type from its magic bytes; the client-supplied type is not trusted. */
  static String detectContentType(byte[] b) {
    if (b == null || b.length < 12) return null;
    if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
    if ((b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
    if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
        && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
    return null;
  }
}
