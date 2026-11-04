import { prisma } from "../db/prisma";
import { NotificationType } from "../enums/ENotificationTypes";
import { notificationService } from "./notificationService";
import { selectionHelper } from "../helpers/mealSelectionHelpers";
import { CreatePresetItemDataRequest, CreatePresetRequest, UpdatePresetItemDataRequest, UpdatePresetRequest } from "../schema/preset";

async function clearOtherDefaultPresets(tx: any, userId: number, menuId: number) {
    await tx.presets.updateMany({
        where: { userId, menuId, isDefault: true },
        data: { isDefault: false },
    });
}

export const presetService = {
    // Simple Preset Operations
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

    createPreset: async (presetData: CreatePresetRequest, userId?: number) => {
        const { presetItems, ...presetDetails } = presetData;
        const effectiveUserId = userId ?? presetDetails.userId;
        if (!effectiveUserId) {
            throw new Error("User ID is required to create a preset");
        }

        const formattedItems = presetItems?.map(({ menuDayId, dayMealId }) => ({
            menuDayId,
            dayMealId,
        }));

        return await prisma.$transaction(async (tx) => {
            if (presetDetails.isDefault) {
                await clearOtherDefaultPresets(tx, effectiveUserId, presetDetails.menuId);
            }

            return await tx.presets.create({
                data: {
                    ...presetDetails,
                    userId: effectiveUserId,
                    ...(formattedItems && formattedItems.length > 0
                        ? {
                            presetItems: {
                                create: formattedItems,
                            },
                        }
                        : {}),
                },
                include: {
                    presetItems: true,
                },
            });
        });
    },

    updatePreset: async (presetId: number, presetData: UpdatePresetRequest, userId?: number) => {
        const { presetItems, ...presetDetails } = presetData;
        const existingPreset = await prisma.presets.findUnique({ where: { id: presetId } });
        if (!existingPreset) {
            throw new Error("Preset not found");
        }

        const effectiveUserId = userId ?? existingPreset.userId;
        const menuId = presetDetails.menuId ?? existingPreset.menuId;

        return await prisma.$transaction(async (tx) => {
            if (presetDetails.isDefault) {
                await clearOtherDefaultPresets(tx, effectiveUserId, menuId);
            }

            if (presetItems) {
                await tx.presetItems.deleteMany({ where: { presetId } });
                if (presetItems.length > 0) {
                    await tx.presetItems.createMany({
                        data: presetItems.map((item) => ({
                            presetId,
                            menuDayId: item.menuDayId,
                            dayMealId: item.dayMealId,
                        })),
                    });
                }
            }

            return await tx.presets.update({
                where: { id: presetId },
                data: {
                    ...presetDetails,
                    userId: effectiveUserId,
                },
                include: {
                    presetItems: true,
                },
            });
        });
    },

    setDefaultPreset: async (presetId: number, userId: number) => {
        const existingPreset = await prisma.presets.findUnique({ where: { id: presetId } });
        if (!existingPreset) {
            throw new Error("Preset not found");
        }

        await prisma.$transaction(async (tx) => {
            await clearOtherDefaultPresets(tx, userId, existingPreset.menuId);
            await tx.presets.update({
                where: { id: presetId },
                data: { isDefault: true },
            });
        });

        return { message: `Preset ${existingPreset.name ?? presetId} successfully set as default` };
    },

    deletePreset: async (presetId: number) => {
        const existingPreset = await prisma.presets.findUnique({ where: { id: presetId } });
        if (!existingPreset) {
            throw new Error("Preset not found");
        }
        await prisma.$transaction(async (tx) => {
            await tx.presetItems.deleteMany({
                where: { presetId },
            });
            await tx.presets.delete({
                where: { id: presetId },
            });
        });
        return { message: `Preset ${existingPreset.name ?? presetId} successfully deleted` };
    },

    // Preset Items Operations
    getPresetItemsByPresetId: async (presetId: number) => {
        return await prisma.presetItems.findMany({
            where: { presetId },
        });
    },

    createPresetItem: async (presetId: number, presetItemData: CreatePresetItemDataRequest) => {
        return await prisma.presetItems.create({
            data: {
                presetId,
                menuDayId: presetItemData.menuDayId,
                dayMealId: presetItemData.dayMealId,
            },
        });
    },

    createPresetItemsBatch: async (presetId: number, presetItemDataArray: CreatePresetItemDataRequest[]) => {
        const batchData = presetItemDataArray.map((itemData) => ({
            presetId,
            menuDayId: itemData.menuDayId,
            dayMealId: itemData.dayMealId,
        }));
        return await prisma.presetItems.createMany({
            data: batchData,
        });
    },

    updatePresetItem: async (presetItemId: number, presetItemData: UpdatePresetItemDataRequest) => {
        return await prisma.presetItems.update({
            where: { id: presetItemId },
            data: presetItemData,
        });
    },

    deletePresetItem: async (presetItemId: number) => {
        return await prisma.presetItems.delete({
            where: { id: presetItemId },
        });
    },

    // Enriched Preset Operations
    getPresetwithDetails: async (presetId: number) => {
        const preset = await prisma.presets.findUnique({
            where: { id: presetId },
        });

        if (!preset) {
            return null;
        }

        const presetDetails = await prisma.presetItems.findMany({
            where: { presetId },
            orderBy: {
                menuDayMeals: {
                    meal: {
                        name: 'asc',
                    },
                },
            },
            select: {
                id: true,
                presetId: true,
                menuDayId: true,
                menuDay: {
                    select: {
                        day: true,
                    },
                },
                dayMealId: true,
                menuDayMeals: {
                    select: {
                        isActive: true,
                        meal: {
                            select: {
                                id: true,
                                name: true,
                                foodCode: true,
                                calories: true,
                                imagePath: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });

        return selectionHelper.formatPresetResponse(presetDetails, preset);
    },
    /**
     * Parallel handler invoked when a meal is made inactive in a menu (menuDayMeals.isActive = false).
     * 1. Resolves the menuDayMeal, meal name, menu title, and day.
     * 2. Finds all preset items referencing this dayMealId.
     * 3. Dispatches both an email and web push notification to each affected user specifying
     *    which menu and meal were affected, and that the item is now unavailable so they can update it.
     */
    handleMenuMealInactivated: async (menuDayMealId: number): Promise<{ usersNotified: number }> => {
        try {
            const mealItem = await prisma.menuDayMeals.findUnique({
                where: { id: menuDayMealId },
                include: {
                    meal: { select: { id: true, name: true } },
                    menuDay: {
                        include: {
                            menu: { select: { id: true, title: true } },
                        },
                    },
                },
            });

            if (!mealItem) {
                return { usersNotified: 0 };
            }

            const mealName = mealItem.meal?.name ?? "a meal";
            const menuTitle = mealItem.menuDay?.menu?.title ?? "current menu";
            const day = mealItem.menuDay?.day ?? "scheduled day";

            const affectedPresetItems = await prisma.presetItems.findMany({
                where: { dayMealId: menuDayMealId },
                include: {
                    preset: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!affectedPresetItems.length) {
                return { usersNotified: 0 };
            }

            const affectedUsers = new Map<number, { id: number; name: string | null; email: string }>();
            for (const item of affectedPresetItems) {
                const user = item.preset?.user;
                if (user && user.status === "ACTIVE" && user.email) {
                    affectedUsers.set(user.id, {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    });
                }
            }

            const userIds = Array.from(affectedUsers.keys());
            if (!userIds.length) {
                return { usersNotified: 0 };
            }

            const title = `Preset Update: Meal Unavailable in ${menuTitle}`;
            const message = `The meal "${mealName}" scheduled for ${day} in menu "${menuTitle}" has been made inactive by an administrator. Your preset item for ${day} has been marked as unavailable. Please update your preset preferences to choose an alternative meal.`;
            const description = `The meal "${mealName}" in menu "${menuTitle}" (${day}) is no longer available. Your preset has been marked as unavailable. Please update your preset.`;

            await notificationService.customNotifyUsers({
                userIds,
                type: NotificationType.PRESET_UPDATE,
                title,
                message,
                description,
            });

            return { usersNotified: userIds.length };
        } catch (err) {
            console.error("Failed to process preset notifications for inactivated menu meal:", err);
            return { usersNotified: 0 };
        }
    },

    /**
     * When a meal is deleted or made inactive globally, handles preset notifications
     * across all menus where that meal is scheduled.
     */
    handleMealInactivated: async (mealId: number) => {
        try {
            const menuDayMeals = await prisma.menuDayMeals.findMany({
                where: { mealId },
                select: { id: true },
            });
            for (const mdm of menuDayMeals) {
                await presetService.handleMenuMealInactivated(mdm.id);
            }
        } catch (err) {
            console.error("Failed to handle meal inactivated for presets:", err);
        }
    },

};
