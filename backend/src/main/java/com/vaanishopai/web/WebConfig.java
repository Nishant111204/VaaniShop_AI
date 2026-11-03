package com.vaanishopai.web;

import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  /** Vite puts a content hash in every file name under /assets, so they never change. */
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/assets/**")
        .addResourceLocations("classpath:/static/assets/")
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
  }

  /** Tomcat doesn't know the web app manifest type out of the box. */
  @Bean
  public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> manifestMimeType() {
    return factory -> {
      var mappings = new MimeMappings(MimeMappings.DEFAULT);
      mappings.add("webmanifest", "application/manifest+json");
      factory.setMimeMappings(mappings);
    };
  }
}
