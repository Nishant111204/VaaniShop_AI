package com.vaanishopai.web;

import com.vaanishopai.dto.ShopSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Draws the 1200×630 card that WhatsApp, Facebook and others show when a shop link
 * is shared: the shop's awning, its name in signboard lettering and its tagline.
 */
@Service
public class OgImageService {

  private static final Logger log = LoggerFactory.getLogger(OgImageService.class);
  static final int W = 1200;
  static final int H = 630;
  private static final int CACHE_SIZE = 200;

  private record Palette(Color awning, Color ink, Color soft) {}

  private static final Map<String, Palette> THEMES = Map.of(
      "green", new Palette(new Color(0x2E9A5F), new Color(0x0F3D27), new Color(0xEAF5EE)),
      "orange", new Palette(new Color(0xF07D1E), new Color(0x5A2A06), new Color(0xFFF1E3)),
      "blue", new Palette(new Color(0x2F6BE0), new Color(0x0F2557), new Color(0xEAF0FC)),
      "purple", new Palette(new Color(0x8E4CCB), new Color(0x35174F), new Color(0xF3EBFA)),
      "rose", new Palette(new Color(0xE2507A), new Color(0x5C1229), new Color(0xFCECF1)),
      "slate", new Palette(new Color(0x4A5875), new Color(0x19212F), new Color(0xEEF0F4)));

  private static final Color INDIGO = new Color(0x1F2A5C);
  private static final Color INDIGO_700 = new Color(0x2F3C7E);
  private static final Color HALDI = new Color(0xFFC53D);

  private final Font sign;
  private final Font text;
  private final Map<String, byte[]> cache = new LinkedHashMap<>(CACHE_SIZE, 0.75f, true) {
    @Override protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) { return size() > CACHE_SIZE; }
  };

  public OgImageService() {
    this.sign = load("fonts/YatraOne-Regular.ttf", new Font(Font.SERIF, Font.BOLD, 12));
    this.text = load("fonts/AnekLatin.ttf", new Font(Font.SANS_SERIF, Font.PLAIN, 12));
  }

  /** Changes whenever what the card shows changes, so preview URLs can be cached for long. */
  public static String version(ShopSchema d) {
    return Integer.toHexString(Objects.hash(d.shopName(), d.tagline(), d.theme()));
  }

  public byte[] render(String slug, ShopSchema d) {
    var key = slug + ":" + version(d);
    synchronized (cache) {
      var hit = cache.get(key);
      if (hit != null) return hit;
    }
    var png = draw(d);
    synchronized (cache) {
      cache.put(key, png);
    }
    return png;
  }

  byte[] draw(ShopSchema d) {
    var p = THEMES.getOrDefault(d.theme(), THEMES.get("slate"));
    var img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
    var g = img.createGraphics();
    try {
      g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
      g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
      g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

      g.setColor(Color.WHITE);
      g.fillRect(0, 0, W, H);
      drawAwning(g, p.awning());

      // Footer band
      int bandTop = H - 104;
      g.setColor(p.soft());
      g.fillRect(0, bandTop, W, H - bandTop);
      g.setFont(text.deriveFont(Font.BOLD, 34f));
      g.setColor(p.ink());
      var fm = g.getFontMetrics();
      g.drawString("See prices and order on WhatsApp", 60, bandTop + 52 + fm.getAscent() / 2 - 6);
      drawBrand(g, bandTop);

      // Shop name, wrapped onto two lines if needed, then the tagline beneath it.
      var lines = fitName(g, d.shopName(), W - 160);
      var nameFont = sign.deriveFont(lines.size);
      g.setFont(nameFont);
      fm = g.getFontMetrics();
      int lineHeight = (int) (lines.size * 1.08f);
      var tagline = d.tagline();
      int taglineHeight = tagline.isBlank() ? 0 : 64;
      int blockHeight = lineHeight * lines.text.size() + taglineHeight;
      int areaTop = 120;
      int areaBottom = bandTop - 20;
      int y = areaTop + (areaBottom - areaTop - blockHeight) / 2 + fm.getAscent();
      g.setColor(p.ink());
      for (var line : lines.text) {
        g.drawString(line, (W - fm.stringWidth(line)) / 2, y);
        y += lineHeight;
      }
      if (!tagline.isBlank()) {
        g.setFont(text.deriveFont(Font.PLAIN, 40f));
        fm = g.getFontMetrics();
        var t = ellipsize(tagline, fm, W - 200);
        g.setColor(INDIGO_700);
        g.drawString(t, (W - fm.stringWidth(t)) / 2, y - lineHeight + fm.getAscent() + 34);
      }
    } finally {
      g.dispose();
    }
    try (var out = new ByteArrayOutputStream()) {
      ImageIO.write(img, "png", out);
      return out.toByteArray();
    } catch (IOException e) {
      throw new IllegalStateException("Could not encode preview image", e);
    }
  }

  private static void drawAwning(Graphics2D g, Color awning) {
    int stripe = 60;
    int height = 72;
    int r = stripe / 2;
    // A soft shadow under the scallops, then the stripes and scallops themselves.
    g.setColor(new Color(20, 27, 61, 28));
    for (int x = 0; x < W; x += stripe) g.fill(new Ellipse2D.Double(x, height - r + 5, stripe, stripe));
    for (int i = 0, x = 0; x < W; i++, x += stripe) {
      g.setColor(i % 2 == 0 ? awning : Color.WHITE);
      g.fillRect(x, 0, stripe, height);
      g.fill(new Ellipse2D.Double(x, height - r, stripe, stripe));
    }
  }

  private void drawBrand(Graphics2D g, int bandTop) {
    g.setFont(text.deriveFont(Font.BOLD, 32f));
    var fm = g.getFontMetrics();
    var label = "VaaniShop";
    int textX = W - 60 - fm.stringWidth(label);
    int markSize = 44;
    int markX = textX - markSize - 14;
    int markY = bandTop + (104 - markSize) / 2;
    g.setColor(INDIGO);
    g.fill(new RoundRectangle2D.Double(markX, markY, markSize, markSize, 14, 14));
    g.setColor(HALDI);
    int[][] bars = {{9, 19, 6}, {16, 12, 20}, {23, 15, 14}, {30, 20, 4}};
    for (var b : bars) {
      g.fill(new RoundRectangle2D.Double(markX + b[0], markY + b[1], 4.2, b[2] + 6, 4, 4));
    }
    g.setColor(INDIGO);
    g.drawString(label, textX, bandTop + 52 + fm.getAscent() / 2 - 6);
  }

  private record Lines(List<String> text, float size) {}

  /** Largest size (from 132px down to 64px) at which the name fits on one line, or on two. */
  private Lines fitName(Graphics2D g, String name, int maxWidth) {
    for (float size = 132; size >= 64; size -= 4) {
      var fm = g.getFontMetrics(sign.deriveFont(size));
      if (fm.stringWidth(name) <= maxWidth) return new Lines(List.of(name), size);
      var split = splitInTwo(name);
      if (split != null && size <= 112
          && fm.stringWidth(split.get(0)) <= maxWidth && fm.stringWidth(split.get(1)) <= maxWidth) {
        return new Lines(split, size);
      }
    }
    var fm = g.getFontMetrics(sign.deriveFont(64f));
    return new Lines(List.of(ellipsize(name, fm, maxWidth)), 64f);
  }

  /** Splits at the space closest to the middle, or null for a single word. */
  static List<String> splitInTwo(String s) {
    int best = -1;
    for (int i = 0; i < s.length(); i++) {
      if (s.charAt(i) == ' ' && (best < 0 || Math.abs(i - s.length() / 2) < Math.abs(best - s.length() / 2))) best = i;
    }
    return best < 0 ? null : List.of(s.substring(0, best).strip(), s.substring(best + 1).strip());
  }

  private static String ellipsize(String s, FontMetrics fm, int maxWidth) {
    if (fm.stringWidth(s) <= maxWidth) return s;
    var t = s;
    while (t.length() > 1 && fm.stringWidth(t + "…") > maxWidth) t = t.substring(0, t.length() - 1);
    return t.strip() + "…";
  }

  private static Font load(String path, Font fallback) {
    try (var in = new ClassPathResource(path).getInputStream()) {
      return Font.createFont(Font.TRUETYPE_FONT, in);
    } catch (Exception e) {
      log.warn("Could not load {}; preview cards will use a system font", path, e);
      return fallback;
    }
  }
}
