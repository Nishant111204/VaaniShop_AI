package com.vaanishopai;

import com.vaanishopai.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(AppProperties.class)
public class VaaniShopAiApplication {
  public static void main(String[] args) {
    SpringApplication.run(VaaniShopAiApplication.class, args);
  }
}

