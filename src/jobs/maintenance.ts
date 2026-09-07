import { prisma } from "../db/prisma";

export async function cleanUpExpiredTokens() {
    const deleted = await prisma.userTokens.deleteMany({
        where: { usedAt: null, expiresAt: { lt: new Date() } },
    });
    return `Deleted ${deleted.count} expired tokens`;
}

