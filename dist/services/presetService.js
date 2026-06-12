"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetService = void 0;
const prisma_1 = require("../db/prisma");
const dayOrder = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];
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
    getPresetsbyUserId: async (userId) => {
        return await prisma_1.prisma.presets.findMany({
            where: { userId },
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
        return await prisma_1.prisma.presetItems.create({
            data: {
                presetId,
                ...presetItemData
            }
        });
    },
    createPresetItemsBatch: async (presetId, presetItemDataArray) => {
        const batchData = presetItemDataArray.map(itemData => ({
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
    //Enriched Presset Operations
    getPresetWithDetailsById: async (presetID) => {
        const preset = await prisma_1.prisma.presets.findUnique({
            where: { id: presetID },
            include: {
                presetItems: {
                    include: {
                        menuDay: true,
                        menuDayMeals: true
                    }
                }
            },
        });
        if (!preset)
            return null;
        const presetItemsByDay = preset.presetItems.reduce((acc, item) => {
            const day = item.menuDay?.day ?? "UNKNOWN";
            (acc[day] ?? (acc[day] = [])).push(item);
            return acc;
        }, {});
        const presetItemsGrouped = [
            ...dayOrder.filter((d) => presetItemsByDay[d]?.length),
            ...Object.keys(presetItemsByDay).filter((d) => !dayOrder.includes(d) && presetItemsByDay[d]?.length),
        ].map((day) => ({
            day,
            items: presetItemsByDay[day],
        }));
        return {
            ...preset,
            presetItemsGrouped,
        };
    }
};
//# sourceMappingURL=presetService.js.map