import { prisma } from "../db/prisma";

export async function cleanUpExpiredTokens() {
  const [tokens, refreshTokens] = await Promise.all([
    prisma.userTokens.deleteMany({
      where: { usedAt: null, expiresAt: { lt: new Date() } },
    }),
    prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);
  return `Deleted ${tokens.count} expired user token(s) and ${refreshTokens.count} expired refresh token(s)`;
}
