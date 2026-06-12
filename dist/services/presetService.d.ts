import { CreatePresetItemDataRequest, CreatePresetRequest } from "../interfaces/preset";
export declare const presetService: {
    getAllPresets: () => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }[]>;
    getPresetbyId: (presetId: number) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    } | null>;
    getPresetsbyUserId: (userId: number) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }[]>;
    createPreset: (presetData: CreatePresetRequest) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }>;
    updatePreset: (presetId: number, presetData: CreatePresetRequest) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }>;
    getPresetItemsByPresetId: (presetId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        presetId: number;
    }[]>;
    createPresetItem: (presetId: number, presetItemData: CreatePresetItemDataRequest) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        presetId: number;
    }>;
    createPresetItemsBatch: (presetId: number, presetItemDataArray: CreatePresetItemDataRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    updatePresetItem: (presetItemId: number, presetItemData: CreatePresetItemDataRequest) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        presetId: number;
    }>;
    deletePresetItem: (presetItemId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        dayMealId: number;
        presetId: number;
    }>;
    getPresetWithDetailsById: (presetID: number) => Promise<{
        presetItemsGrouped: {
            day: string;
            items: ({
                menuDayMeals: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                    menuDayId: number;
                    mealId: number;
                };
                menuDay: {
                    createdAt: Date;
                    id: number;
                    menuId: number;
                    day: import("../generated/prisma").$Enums.Days;
                };
            } & {
                createdAt: Date;
                updatedAt: Date;
                id: number;
                menuDayId: number;
                dayMealId: number;
                presetId: number;
            })[] | undefined;
        }[];
        presetItems: ({
            menuDayMeals: {
                createdAt: Date;
                updatedAt: Date;
                id: number;
                menuDayId: number;
                mealId: number;
            };
            menuDay: {
                createdAt: Date;
                id: number;
                menuId: number;
                day: import("../generated/prisma").$Enums.Days;
            };
        } & {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            menuDayId: number;
            dayMealId: number;
            presetId: number;
        })[];
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    } | null>;
};
//# sourceMappingURL=presetService.d.ts.map