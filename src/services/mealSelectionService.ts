import { prisma } from "../db/prisma";
import { Days } from "../generated/prisma";
import { CreateMealSelectionRequest } from "../interfaces/mealSelection";

const selectionSelectShape = {
    id: true,
    createdBy: true,
    createdFor: true,
    user:{
        select: {
            id: true,
            name: true,
            email: true,
        }},
    createdForUser:{
        select: {
            id: true,
            name: true,
            email: true,
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
                    name: true,
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
    getSelectionsByFilter: async(filter: {createdBy?: number, createdFor?: number, mealId?: number, day?: string, menuId?: number})=>{
        return await prisma.selections.findMany({
            where: filter,
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
    getSelectionsByDay: async(day: Days)=>{
        return await prisma.selections.findMany({
            where: {menuDay: {day}},
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
        return await prisma.selections.findMany({where: {createdBy: userId}, select: selectionSelectShape});
    },

    //CREATE Selections

    createSelection: async(selectionData : CreateMealSelectionRequest)=>{
        return await prisma.selections.create({data: selectionData, select: selectionSelectShape});
    },
    createSelectionsBatch: async(selectionDataArray : CreateMealSelectionRequest[])=>{
        return await prisma.selections.createMany({data: selectionDataArray});
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

}