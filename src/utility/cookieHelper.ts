import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Returns Express CookieOptions for setting the refresh token.
 * If keepSignedIn is true, sets maxAge to 14 days (persistent cookie).
 * If keepSignedIn is false, omits maxAge to make it a session-only cookie (cleared on browser close).
 */
export type AuthCookieOptions = CookieOptions & { partitioned?: boolean };

const getBaseCookieOptions = (): AuthCookieOptions => {
  const sameSiteConfig = (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || "lax";
  const secureConfig = process.env.COOKIE_SECURE !== undefined 
    ? process.env.COOKIE_SECURE === "true" 
    : isProduction;

  const options: AuthCookieOptions = {
    httpOnly: true,
    secure: secureConfig,
    sameSite: sameSiteConfig,
    path: "/",
  };

  // Guard against public suffixes (e.g. .vercel.app) which browsers reject outright
  if (process.env.COOKIE_DOMAIN && !process.env.COOKIE_DOMAIN.includes("vercel.app")) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  if (isProduction) {
    options.partitioned = true;
  }

  return options;
};

/**
 * Returns Express CookieOptions for setting the refresh token.
 * If keepSignedIn is true, sets maxAge to 14 days (persistent cookie).
 * If keepSignedIn is false, omits maxAge to make it a session-only cookie (cleared on browser close).
 */
export const getRefreshTokenCookieOptions = (keepSignedIn: boolean = false): CookieOptions => {
  const options = getBaseCookieOptions();

  if (keepSignedIn) {
    // 14 days in milliseconds
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    options.maxAge = maxAgeMs;
  }

  return options as CookieOptions;
};

/**
 * Returns Express CookieOptions for clearing the refresh token cookie.
 */
export const getClearRefreshTokenCookieOptions = (): CookieOptions => {
  return getBaseCookieOptions() as CookieOptions;
};
