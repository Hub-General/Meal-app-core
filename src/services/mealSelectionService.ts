import { prisma } from "../db/prisma";
import { Days } from "../generated/prisma";
import { getISOWeekInfo } from "../helpers/dateFunctions";
import { selectionHelper } from "../helpers/mealSelectionHelpers";
import { CreateMealSelectionRequest, MealSelectionFilter } from "../schema/mealSelection";
import { weekMenuScheduleService } from "./weekMenuScheduleService";

const selectionSelectShape = {
    id: true,
    createdBy: true,
    createdFor: true,
    weekMenuScheduleId: true,
    selectionStatus: true,
    createdByUser:{
        select: {
            id: true,
            name: true,
        }},
    createdForUser:{
        select: {
            id: true,
            name: true,
        }},
    menuDay:{
        select: {
            id: true,
            day: true,
        }},
    dayMeal:{
        select: {
            id: true,
            meal:{
                select: {
                    id: true,
                    imagePath:true,
                    name: true,
                    calories: true,
                    image: true,
                    foodCode: true,
                }
            }
        }
    },
    createdAt: true,
    updatedAt: true,
}

export const mealSelectionService = {

    //GET Selections

    getAllSelections: async()=>{
        return await prisma.selections.findMany({
            select: selectionSelectShape
        });
    },
    getSelectionsByFilter: async(filter: MealSelectionFilter )=>{
        return await prisma.selections.findMany({
            where: filter,
            select: selectionSelectShape
        });
    },

    getSelectionsByIds: async(ids: number[])=>{
        return await prisma.selections.findMany({
            where: {id: {in: ids}},
            select: selectionSelectShape
        });
    },
    getSelectionsByDateRange: async(startDate: Date, endDate: Date)=>{
        return await prisma.selections.findMany({
            where: {createdAt: {gte: startDate, lte: endDate}},
            select: selectionSelectShape
        });
    },
    getSelectionsByMealId: async(mealId: number)=>{
        return await prisma.selections.findMany({
            where: {dayMeal: {mealId}},
            select: selectionSelectShape
        });
    },
    getSelectionsByMenuId: async(menuId: number)=>{
        return await prisma.selections.findMany({
            where: {menuDay: {menuId}},
            select: selectionSelectShape
        });
    },
    getSelectionById: async(selectionId: number)=>{
        return await prisma.selections.findUnique({where: {id: selectionId}, select: selectionSelectShape});
    },
    getSelectionsByUserId: async(userId: number)=>{
        return await prisma.selections.findMany({where: {createdFor: userId}, select: selectionSelectShape});
    },
    getSelectionsByCreatorId: async(creatorId: number)=>{
        return await prisma.selections.findMany({where: {createdBy: creatorId}, select: selectionSelectShape})
    },

    //GET Weekly Selections

    getWeeklySelectionsByDate: async(date: Date)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        if(!weekMenuSchedule) return [];
        const response = await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id,
                menuDay: {day: weekInfo.dayName as Days}
            },
            select: selectionSelectShape
        });
        return selectionHelper.formatDaySelectionResponse(response)
    },

    getUsersWithoutSelections: async(date: Date)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        
        const result = await prisma.$queryRaw`
            SELECT u.id
            FROM "Users" u
            WHERE u."status" = "ACTIVE"
            LEFT JOIN "Selections" s
            ON s."createdFor" = u.id
            AND s."weekMenuScheduleId" = ${weekMenuSchedule}
            GROUP BY u.id
            HAVING COUNT(s.id) < 5;
            `;

        return result
    },

    getWeeklySelections: async(date: Date)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        if(!weekMenuSchedule) return [];
        const response =  await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id
            },
            select: selectionSelectShape
        });
        return selectionHelper.formatSelectionResponse(response)
    },

    getWeeklySelectionsByUser: async(date: Date, createdFor: number)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        if(!weekMenuSchedule) return [];
        return await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id,
                createdFor
            },
            select: selectionSelectShape
        });
    },


    //CREATE Selections

    createSelection: async(selectionData : CreateMealSelectionRequest)=>{
        return await prisma.selections.create({data: {...selectionData, selectionStatus: "PENDING"}, select: selectionSelectShape});
    },
    createSelectionsBatch: async(selectionDataArray : CreateMealSelectionRequest[])=>{
        return await prisma.selections.createMany({data: selectionDataArray.map(data => ({...data, selectionStatus: "PENDING"})), skipDuplicates: true});
    },

    // UPDATE Selections
    
    updateSelection: async(selectionId: number, selectionData: CreateMealSelectionRequest)=>{
        return await prisma.selections.update({where: {id: selectionId}, data: selectionData, select: selectionSelectShape})
    },
    updateSelectionsBatch: async(selectionsData: {id: number, data: CreateMealSelectionRequest}[])=>{
        const updateSelections = selectionsData.map(selection => 
            prisma.selections.update({where: {id: selection.id}, data: selection.data, select: selectionSelectShape})
        );
        return await Promise.all(updateSelections);
    },

    // SUBMIT selections

    submitSelections: async (selectionIds: number[])=>{
        return await prisma.selections.updateMany({
            where: {id: {in: selectionIds}},
            data: {selectionStatus: "SUBMITTED"}
        });
    },

    submitWeeklySelections: async (weekNumber: number, year: number)=>{
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekNumber, year: year});
        if(!weekMenuSchedule) return;
        return await prisma.selections.updateMany({where:{weekMenuScheduleId: weekMenuSchedule.id}, data: {selectionStatus: "SUBMITTED"}})
    }
}
