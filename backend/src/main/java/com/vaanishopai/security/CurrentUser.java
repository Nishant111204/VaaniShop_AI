package com.vaanishopai.security;

import com.vaanishopai.exception.UnauthorizedException;
import com.vaanishopai.model.User;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

  private CurrentUser() {}

  public static User require() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof User user)) {
      throw new UnauthorizedException("Please sign in to continue");
    }
    return user;
  }
}
