import { CreatePresetItemDataRequest, CreatePresetRequest, UpdatePresetItemDataRequest, UpdatePresetRequest } from "../schema/preset";
export declare const presetService: {
    getAllPresets: () => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
        menuId: number;
        isDefault: boolean;
    }[]>;
    getPresetbyId: (presetId: number) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
        menuId: number;
        isDefault: boolean;
    } | null>;
    getPresetsbyUserId: (userId: number, menuId?: number) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
        menuId: number;
        isDefault: boolean;
    }[]>;
    createPreset: (presetData: CreatePresetRequest) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
        menuId: number;
        isDefault: boolean;
    }>;
    updatePreset: (presetId: number, presetData: UpdatePresetRequest) => Promise<{
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
        menuId: number;
        isDefault: boolean;
    }>;
    getPresetItemsByPresetId: (presetId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        presetId: number;
        dayMealId: number;
    }[]>;
    createPresetItem: (presetId: number, presetItemData: CreatePresetItemDataRequest) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        presetId: number;
        dayMealId: number;
    }>;
    createPresetItemsBatch: (presetId: number, presetItemDataArray: CreatePresetItemDataRequest[]) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    updatePresetItem: (presetItemId: number, presetItemData: UpdatePresetItemDataRequest) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        presetId: number;
        dayMealId: number;
    }>;
    deletePresetItem: (presetItemId: number) => Promise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        menuDayId: number;
        presetId: number;
        dayMealId: number;
    }>;
    getPresetwithDetails: (presetId: number) => Promise<any>;
};
//# sourceMappingURL=presetService.d.ts.map