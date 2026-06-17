import { prisma } from "../prisma/client";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";
import { getISOWeekInfo } from "./dateFunctions";

    // HELPER METHODS FOR VALIDATION
export const selectionHelper = {

    isWeekSubmitted: async(weekMenuScheduleId: number, userId: number): Promise<boolean> => {
        const count = await prisma.selections.count({
            where: {
                weekMenuScheduleId,
                createdFor: userId,
                selectionStatus: "SUBMITTED"
            }
        });
        return count > 0;
    },


    isSelectionExist: async(weekMenuScheduleId: number, menuDayId: number, userId: number): Promise<boolean> => {
        const count = await prisma.selections.count({
            where: {
                weekMenuScheduleId,
                menuDayId,
                createdFor: userId
            }
        });
        return (count > 0);
    },

    isCurrentWeek: async(weekMenuScheduleId: number): Promise<boolean>=>{
        const today = new Date();
        const weekInfo = await weekMenuScheduleService.getWeekMenuScheduleById(weekMenuScheduleId);
        if(!weekInfo) return false;

        return(
            getISOWeekInfo(today).week === weekInfo.week &&
            getISOWeekInfo(today).year === weekInfo.year
        );
    },
}