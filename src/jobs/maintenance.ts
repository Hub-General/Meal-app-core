import { prisma } from "../db/prisma";
import { tasteProfileService } from "../services/tasteProfileService";

export async function cleanUpExpiredTokens() {
    const deleted = await prisma.userTokens.deleteMany({
        where: { usedAt: null, expiresAt: { lt: new Date() } },
    });
    return `Deleted ${deleted.count} expired tokens`;
}


export async function updateUserTasteProfiles() {
    const currentYear = new Date().getFullYear();
    const updatedProfiles = await tasteProfileService.updateActiveUsersTasteProfiles(currentYear);
    return `Updated ${updatedProfiles.length} active user taste profiles for ${currentYear}`;
}
