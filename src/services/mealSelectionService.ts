import { prisma } from "../db/prisma";
import { SelectionStatus } from "../generated/prisma";
import { getISOWeekInfo } from "../helpers/dateFunctions";
import { selectionHelper } from "../helpers/mealSelectionHelpers";
import { SelectionValidationError, validateSelectionUpdates } from "../helpers/validateSelectionUpdate";
import { CreateMealSelectionRequest, MealSelectionFilter, UpdateMealSelectionRequest } from "../schema/mealSelection";
import { weekMenuScheduleService } from "./weekMenuScheduleService";

const selectionSelectShape = {
    id: true,
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

    getAllSelections: async(filter?: MealSelectionFilter)=>{
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

    //Will remove this and add it to the filters
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

    getUsersWithoutSelections: async(date: Date)=>{
        const weekInfo = getISOWeekInfo(date);
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekInfo.week, year: weekInfo.year});
        
        if(!weekMenuSchedule) return [];

        const result = await prisma.$queryRaw`
            SELECT u."id", u."name", u."email"
            FROM "Users" u
            LEFT JOIN "Selections" s
              ON s."createdBy" = u."id"
              AND s."weekMenuScheduleId" = ${weekMenuSchedule.id}
            WHERE u."status" = 'ACTIVE'
            GROUP BY u."id", u."name", u."email"
            HAVING COUNT(s."id") < 5
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
        const response =  await prisma.selections.findMany({
            where: {
                weekMenuScheduleId: weekMenuSchedule.id,
                createdFor
            },
            select: selectionSelectShape
        });
        return selectionHelper.formatUserSelectionsResponse(response)
    },


    //CREATE Selections

    createSelection: async (
            selectionData: CreateMealSelectionRequest,
            requesterId: number
        ) => {
            const { id, createdBy, ...data } = selectionData;

            return await prisma.selections.create({
                data: {
                    ...data,
                    createdBy: requesterId,
                    selectionStatus: "PENDING",
                },
                select: selectionSelectShape,
            });
        },


    submitSelections: async (
        selectionRequests: CreateMealSelectionRequest[],
        requesterId: number
    ) => {

        if (!selectionRequests?.length) {
            throw new Error("At least one selection is required");
        }

        return await prisma.$transaction(async (tx) => {

            const newSelections: CreateMealSelectionRequest[] = [];
            const updateSelections: CreateMealSelectionRequest[] = [];

            // Separate creates from updates in one pass.
            for (const selection of selectionRequests) {
                if (selection.id === undefined) {
                    newSelections.push(selection);
                } else {
                    updateSelections.push(selection);
                }
            }

            const updateIds = updateSelections.map(
                selection => selection.id!
            );

            const existingSelections = updateIds.length
                ? await tx.selections.findMany({
                    where: {
                        id: {
                            in: updateIds
                        }
                    },
                    select: {
                        id: true,
                        createdFor: true,
                        createdBy: true,
                        selectionStatus: true
                    }
                })
                : [];


            const existingMap = new Map(
                existingSelections.map(selection => [
                    selection.id,
                    selection
                ])
            );


            const errors = validateSelectionUpdates(
                updateSelections,
                requesterId,
                existingMap
            );

            if (errors.length > 0) {
                throw new SelectionValidationError(errors);
            }


            if (newSelections.length > 0) {

                await tx.selections.createMany({
                    data: newSelections.map(selection => ({
                        dayMealId: selection.dayMealId,
                        createdBy: requesterId,
                        createdFor: selection.createdFor,
                        weekMenuScheduleId:
                            selection.weekMenuScheduleId,
                        menuDayId: selection.menuDayId,
                        selectionStatus: "PENDING"
                    })),
                    skipDuplicates: true
                });
            }


            for (const request of updateSelections) {

                const existing = existingMap.get(request.id!);

                if (!existing) {
                    throw new SelectionValidationError([
                        {
                            id: request.id!,
                            reason: "NOT_FOUND"
                        }
                    ]);
                }

                const isCreatedForOwner =
                    existing.createdFor === requesterId;

                /*
                * If the requester is the person the selection
                * belongs to, they are now the person submitting it.
                *
                * If requester is only createdBy, createdFor remains
                * untouched.
                */
                const updateData = {
                    dayMealId: request.dayMealId,
                    weekMenuScheduleId:
                        request.weekMenuScheduleId,
                    menuDayId: request.menuDayId,

                    ...(isCreatedForOwner
                        ? {
                            createdBy: requesterId
                        }
                        : {})
                };

                /*
                * Re-check the important authorization conditions
                * inside the UPDATE itself.
                *
                * This protects against the row changing between
                * findMany() and update().
                */
                const updateResult = await tx.selections.updateMany({
                    where: {
                        id: request.id!,
                        selectionStatus: "PENDING",

                        OR: [
                            {
                                createdFor: requesterId
                            },
                            {
                                createdBy: requesterId
                            }
                        ]
                    },
                    data: updateData
                });

                if (updateResult.count !== 1) {
                    throw new SelectionValidationError([
                        {
                            id: request.id!,
                            reason: "NOT_AUTHORIZED"
                        }
                    ]);
                }
            }

            return {
                created: newSelections.length,
                updated: updateSelections.length
            };
        });
    },



    // UPDATE Selections
    
    updateSelectionsBatch: async(selectionsData: {id: number, data: CreateMealSelectionRequest}[])=>{
        const updateSelections = selectionsData.map(selection => 
            prisma.selections.update({where: {id: selection.id}, data: selection.data, select: selectionSelectShape})
        );
        return await Promise.all(updateSelections);
    },

    // SUBMIT selections

    changeSelectionsStatus: async (selectionIds: number[], status: SelectionStatus )=>{
        return await prisma.selections.updateMany({
            where: {id: {in: selectionIds}},
            data: {selectionStatus: status}
        });
    },

    changeWeeklySelectionsStatus: async (weekNumber: number, year: number , status: SelectionStatus)=>{
        const weekMenuSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({week: weekNumber, year: year});
        if(!weekMenuSchedule) return;
        return await prisma.selections.updateMany({where:{weekMenuScheduleId: weekMenuSchedule.id}, data: {selectionStatus: status}})
    },

    //ADMIN Services
    adminOverrideSelections: async(selections: UpdateMealSelectionRequest[])=>{
        return await prisma.selections.updateMany({
            where:{id: {in: selections.map(item=> item.id!)}},
            data: selections
        })
    }
}
