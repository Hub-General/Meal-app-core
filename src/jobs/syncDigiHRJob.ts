import { digiHRService } from "../services/digiHRService";

export async function syncDigiHRJob (){
    try{
        await digiHRService.syncUsersWithDatabase()
        await digiHRService.updateUserAvailabilityTable()
    }catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to update Users from DigiHR. Message: ${message}`)
    }
}