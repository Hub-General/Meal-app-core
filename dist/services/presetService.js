"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetService = void 0;
const prisma_1 = require("../db/prisma");
const mealSelectionHelpers_1 = require("../helpers/mealSelectionHelpers");
exports.presetService = {
    //Simple Preset Operations
    getAllPresets: async () => {
        return await prisma_1.prisma.presets.findMany();
    },
    getPresetbyId: async (presetId) => {
        return await prisma_1.prisma.presets.findUnique({
            where: { id: presetId },
        });
    },
    getPresetsbyUserId: async (userId, menuId) => {
        return await prisma_1.prisma.presets.findMany({
            where: { userId, menuId },
        });
    },
    createPreset: async (presetData) => {
        return await prisma_1.prisma.presets.create({
            data: presetData,
        });
    },
    updatePreset: async (presetId, presetData) => {
        return await prisma_1.prisma.presets.update({
            where: { id: presetId },
            data: presetData,
        });
    },
    //Preset Items Operations
    getPresetItemsByPresetId: async (presetId) => {
        return await prisma_1.prisma.presetItems.findMany({
            where: { presetId },
        });
    },
    createPresetItem: async (presetId, presetItemData) => {
        const { presetId: _, ...data } = presetItemData;
        return await prisma_1.prisma.presetItems.create({
            data: {
                presetId,
                ...data
            }
        });
    },
    createPresetItemsBatch: async (presetId, presetItemDataArray) => {
        const batchData = presetItemDataArray.map(({ presetId: _, ...itemData }) => ({
            presetId,
            ...itemData
        }));
        return await prisma_1.prisma.presetItems.createMany({
            data: batchData
        });
    },
    updatePresetItem: async (presetItemId, presetItemData) => {
        return await prisma_1.prisma.presetItems.update({
            where: { id: presetItemId },
            data: presetItemData
        });
    },
    deletePresetItem: async (presetItemId) => {
        return await prisma_1.prisma.presetItems.delete({
            where: { id: presetItemId }
        });
    },
    //Enriched Preset Operations
    getPresetwithDetails: async (presetId) => {
        const preset = await prisma_1.prisma.presets.findUnique({
            where: { id: presetId }
        });
        if (!preset) {
            return;
        }
        const presetDetails = await prisma_1.prisma.presetItems.findMany({
            where: { presetId: presetId },
            select: {
                id: true,
                presetId: true,
                menuDayId: true,
                menuDay: {
                    select: {
                        day: true
                    }
                },
                dayMealId: true,
                menuDayMeals: {
                    select: {
                        meal: {
                            select: {
                                id: true,
                                name: true,
                                foodCode: true,
                                calories: true,
                                imagePath: true,
                                isActive: true,
                            }
                        }
                    }
                }
            }
        });
        return mealSelectionHelpers_1.selectionHelper.formatPresetResponse(presetDetails, preset);
    }
};
//# sourceMappingURL=presetService.js.map