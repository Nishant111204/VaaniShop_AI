package com.vaanishopai.web;

import com.vaanishopai.dto.ShopSchema;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OgImageServiceTest {

  private final OgImageService service = new OgImageService();

  private static ShopSchema shop(String name, String tagline, String theme) {
    return new ShopSchema(name, tagline, "", "grocery", "", "", "", "", "", "", theme, "", List.of());
  }

  @Test
  void rendersAPngOfTheRightSize() throws Exception {
    for (var name : List.of("Ganesh Sweets", "Shree Mahalaxmi Kirana and General Provision Store", "Supercalifragilisticexpialidocious")) {
      var png = service.draw(shop(name, "Fresh staples, fair prices", "green"));
      var img = ImageIO.read(new ByteArrayInputStream(png));
      assertNotNull(img, name);
      assertEquals(OgImageService.W, img.getWidth());
      assertEquals(OgImageService.H, img.getHeight());
    }
  }

  @Test
  void versionChangesWhenTheCardWould() {
    var a = OgImageService.version(shop("Ganesh Sweets", "Fresh", "rose"));
    assertEquals(a, OgImageService.version(shop("Ganesh Sweets", "Fresh", "rose")));
    assertNotEquals(a, OgImageService.version(shop("Ganesh Sweets", "Fresh", "green")));
    assertNotEquals(a, OgImageService.version(shop("Ganesh Sweet House", "Fresh", "rose")));
  }

  @Test
  void splitsNamesNearTheMiddle() {
    assertEquals(List.of("Sharma", "Kirana Store"), OgImageService.splitInTwo("Sharma Kirana Store"));
    assertEquals(List.of("Ganesh Sweet", "House Dadar"), OgImageService.splitInTwo("Ganesh Sweet House Dadar"));
    assertNull(OgImageService.splitInTwo("Supercalifragilistic"));
  }
}
