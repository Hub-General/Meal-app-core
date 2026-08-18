import { prisma } from "../db/prisma";
import { selectionHelper } from "../helpers/mealSelectionHelpers";
import { CreatePresetItemDataRequest, CreatePresetRequest, Preset } from "../schema/preset";

export const presetService = {

    //Simple Preset Operations
    getAllPresets: async () => {
        return await prisma.presets.findMany();
    },
    getPresetbyId: async (presetId: number) => {
        return await prisma.presets.findUnique({
            where: { id: presetId },
        });
    },
    getPresetsbyUserId: async (userId: number, menuId?: number) => {
        return await prisma.presets.findMany({
            where: { userId, menuId },
        });
    },
    createPreset: async (presetData: CreatePresetRequest) => {
        const { presetItems, ...presetDetails } = presetData;
        return await prisma.presets.create({
            data: {
                ...presetDetails,
                ...(presetItems && presetItems.length > 0
                    ? {
                        presetItems: {
                            create: presetItems,
                        },
                    }
                    : {}),
            },
            include: {
                presetItems: true,
            },
        });
    },
    updatePreset: async (presetId: number, presetData: CreatePresetRequest) => {
        const { presetItems, ...presetDetails } = presetData;
        return await prisma.presets.update({
            where: { id: presetId },
            data: presetDetails,
        });
    },

    //Preset Items Operations
    getPresetItemsByPresetId: async(presetId: number)=>{
        return await prisma.presetItems.findMany({
            where: {presetId},
        })
    },

    setDefaultPreset: async(data:Preset, userId: number)=>{
        await prisma.$transaction(async(tx)=>{
            
            await tx.presets.updateMany({
                where:{userId: userId, isDefault:true , menuId: data.menuId},
                data:{isDefault: false}
            })
            await tx.presets.update({
               where:{id: data.id},
               data:{isDefault:true}
           })
        })

        return {message: `Default Preset for Menu ID ${data.menuId} successfully set`}
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
    getPresetwithDetails: async(presetId: number)=>{
        const preset =  await prisma.presets.findUnique({
            where:{id: presetId}
        })

        if(!preset){
            return
        }
        
        const presetDetails = await prisma.presetItems.findMany({
            where:{presetId: presetId}, 
            select:{
                id:true,
                presetId:true,
                menuDayId:true,
                menuDay:{
                    select:{
                        day: true
                    }
                },
                dayMealId:true,
                menuDayMeals:{
                    select:{
                        meal:{
                            select:{
                                id:true,
                                name: true,
                                foodCode: true,
                                calories: true,
                                imagePath: true,
                                isActive: true,
                        }}
                    }
                }
            }
        })

        return selectionHelper.formatPresetResponse(presetDetails, preset)
    }
}
