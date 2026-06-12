import { prisma } from "../db/prisma";
import { CreatePresetItemDataRequest, CreatePresetRequest } from "../interfaces/preset";
import { Days as EDays } from "../enums/EDays";

const dayOrder: EDays[] = [
    EDays.MONDAY,
    EDays.TUESDAY,
    EDays.WEDNESDAY,
    EDays.THURSDAY,
    EDays.FRIDAY,
    EDays.SATURDAY,
    EDays.SUNDAY,
];

export const presetService = {

    //Simple Preset Operations
    getAllPresets: async()=>{
        return await prisma.presets.findMany()
    },
    getPresetbyId : async(presetId: number)=>{
        return await prisma.presets.findUnique({
            where: {id: presetId},
        })
    },
    getPresetsbyUserId: async(userId:number)=>{
        return await prisma.presets.findMany({
            where: {userId},
        })
    },
    createPreset: async(presetData: CreatePresetRequest)=>{
        return await prisma.presets.create({
            data: presetData,
        })
    },
    updatePreset: async(presetId: number, presetData: CreatePresetRequest)=>{
        return await prisma.presets.update({
            where: {id: presetId},
            data: presetData,
        })
    },

    //Preset Items Operations
    getPresetItemsByPresetId: async(presetId: number)=>{
        return await prisma.presetItems.findMany({
            where: {presetId},
        })
    },

    createPresetItem: async(presetId: number, presetItemData: CreatePresetItemDataRequest) =>{
        return await prisma.presetItems.create({
            data: {
                presetId,
                ...presetItemData
            }
        })
    },

    createPresetItemsBatch: async(presetId: number, presetItemDataArray: CreatePresetItemDataRequest[]) =>{
        const batchData = presetItemDataArray.map(itemData => ({
            presetId,
            ...itemData
        }));
        return await prisma.presetItems.createMany({
            data: batchData
        })
    },

    updatePresetItem: async(presetItemId: number, presetItemData: CreatePresetItemDataRequest) =>{
        return await prisma.presetItems.update({
            where: {id: presetItemId},
            data: presetItemData
        })
    },

    deletePresetItem: async(presetItemId: number) =>{
        return await prisma.presetItems.delete({
            where: {id: presetItemId}
        })
    },

    //Enriched Preset Operations

    getPresetWithDetailsById: async(presetID: number)=>{
        const preset = await prisma.presets.findUnique({
            where: {id: presetID},
            include: {
                presetItems: {
                    include: {
                        menuDay: {
                            select: {
                                day: true
                            }
                        },
                        menuDayMeals: {
                            include: {
                                meal:{
                                    select: {
                                        name: true,
                                        id: true,
                                    }
                                },
                            },
                        },
                    }
                }},
        })

        if (!preset) return null;

        const presetItemsByDay = dayOrder.reduce(
            (acc, day) => {
                acc[day] = [];
                return acc;
            },
            {} as Record<EDays, typeof preset.presetItems>
        );

        const unknownDayItems: typeof preset.presetItems = [];

        for (const item of preset.presetItems) {
            const day = item.menuDay?.day as EDays | undefined;
            if (day && presetItemsByDay[day]) {
                presetItemsByDay[day].push(item);
            } else {
                unknownDayItems.push(item);
            }
        }

        const presetItemsGrouped = [
            ...dayOrder.map((day) => ({ day, items: presetItemsByDay[day] })),
            ...(unknownDayItems.length ? [{ day: "UNKNOWN", items: unknownDayItems }] : []),
        ];

        return {
            ...preset,
            presetItemsGrouped,
        };
    }
}
