import { prisma } from "../db/prisma";

export const tasteProfileService = {
    getTasteProfileByUserId: async (userId: number) => {
        return await prisma.tasteProfile.findMany();
    },
}