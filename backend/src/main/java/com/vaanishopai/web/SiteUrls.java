package com.vaanishopai.web;

import com.vaanishopai.config.AppProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/** Absolute URLs for link previews and the sitemap. */
@Component
public class SiteUrls {

  private final String configured;

  public SiteUrls(AppProperties props) {
    var url = props.site() == null ? null : props.site().publicUrl();
    this.configured = url == null || url.isBlank() ? null : url.replaceAll("/+$", "");
  }

  /** APP_PUBLIC_URL when set; otherwise the current request's origin (which honours FORWARD_HEADERS_STRATEGY). */
  public String base() {
    if (configured != null) return configured;
    return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString().replaceAll("/+$", "");
  }

  public String shop(String slug) {
    return base() + "/s/" + slug;
  }
}
