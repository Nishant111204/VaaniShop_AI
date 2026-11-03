package com.vaanishopai.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class ImageServiceTest {

  private static byte[] padded(byte... head) {
    var b = new byte[16];
    System.arraycopy(head, 0, b, 0, head.length);
    return b;
  }

  @Test
  void detectsImageTypesFromMagicBytes() {
    assertEquals("image/jpeg", ImageService.detectContentType(padded((byte) 0xFF, (byte) 0xD8, (byte) 0xFF)));
    assertEquals("image/png", ImageService.detectContentType(padded((byte) 0x89, (byte) 'P', (byte) 'N', (byte) 'G')));
    assertEquals("image/webp", ImageService.detectContentType("RIFF0000WEBPVP8 ".getBytes(StandardCharsets.US_ASCII)));
  }

  @Test
  void rejectsEverythingElse() {
    assertNull(ImageService.detectContentType("<svg onload=alert(1)>".getBytes(StandardCharsets.US_ASCII)));
    assertNull(ImageService.detectContentType("GIF89a__________".getBytes(StandardCharsets.US_ASCII)));
    assertNull(ImageService.detectContentType(new byte[3]));
    assertNull(ImageService.detectContentType(null));
  }
}
