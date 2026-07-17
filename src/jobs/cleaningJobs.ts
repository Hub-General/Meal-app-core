import { prisma } from "../db/prisma";

export const cleaningJobs = {
    cleanUpUserTokens : async()=>{
        try{
            const deleted = await prisma.userTokens.deleteMany({where:{usedAt: null , expiresAt:{lt: new Date()}}})
            return (`Deleted ${deleted.count} expired tokens`)
        }catch{
            throw new Error("Failed to Clean Up Tokens")
        }
    }
}