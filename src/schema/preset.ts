export interface Preset {
    id: number;
    name: string;
    description?: string;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePresetRequest {
    name?: string;
    description?: string;
    userId: number;
}

export interface PresetItem {
    id: number;
    presetId: number;
    menuDayId: number;
    dayMealId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePresetItemDataRequest {
    menuDayId: number;
    dayMealId: number;
}