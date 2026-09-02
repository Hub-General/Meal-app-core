import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Returns Express CookieOptions for setting the refresh token.
 * If keepSignedIn is true, sets maxAge to 7 days (persistent cookie).
 * If keepSignedIn is false, omits maxAge to make it a session-only cookie (cleared on browser close).
 */
export const getRefreshTokenCookieOptions = (keepSignedIn: boolean = false): CookieOptions => {
  const sameSiteConfig = (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || (isProduction ? "none" : "lax");
  const secureConfig = process.env.COOKIE_SECURE !== undefined 
    ? process.env.COOKIE_SECURE === "true" 
    : isProduction;

  const options: CookieOptions = {
    httpOnly: true,
    secure: secureConfig,
    sameSite: sameSiteConfig,
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  if (keepSignedIn) {
    // 7 days in milliseconds
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    options.maxAge = maxAgeMs;
  }

  return options;
};

/**
 * Returns Express CookieOptions for clearing the refresh token cookie.
 */
export const getClearRefreshTokenCookieOptions = (): CookieOptions => {
  const sameSiteConfig = (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || (isProduction ? "none" : "lax");
  const secureConfig = process.env.COOKIE_SECURE !== undefined 
    ? process.env.COOKIE_SECURE === "true" 
    : isProduction;

  const options: CookieOptions = {
    httpOnly: true,
    secure: secureConfig,
    sameSite: sameSiteConfig,
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};
