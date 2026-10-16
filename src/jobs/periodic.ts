import { prisma } from "../db/prisma";
import { NotificationType } from "../enums/ENotificationTypes";
import { digiHRService } from "../services/digiHRService";
import { notificationService } from "../services/notificationService";
import { weekMenuScheduleService } from "../services/weekMenuScheduleService";
import { getISOWeekInfo, getUnavailableDays, getWeekRange } from "../helpers/dateFunctions";
import { tasteProfileService } from "../services/tasteProfileService";
import { SelectionStatus, SelectionType, WeekMenuStatus } from "../generated/prisma";

export async function syncDigiHRUsers() {
    await digiHRService.syncUsersWithDatabase();
    return "DigiHR users synced successfully";
}

export async function syncDigiHRUsersLeaves() {
    await digiHRService.syncUsersLeavesWithDatabase();
    return "DigiHR user leaves synced successfully";
}

export async function getNextCycleMenu(
    activeMenus: Array<{ id: number; order: number | null }>,
    targetWeek: { week: number; year: number }
) {
    if (activeMenus.length === 0) {
        throw new Error("No active menus available to schedule");
    }

    if (activeMenus.length === 1) {
        return activeMenus[0]!;
    }

    // Query the last N weekMenuSchedules strictly prior to targetWeek by calendar weeks
    const priorSchedules = await prisma.weekMenuSchedule.findMany({
        where: {
            OR: [
                { year: { lt: targetWeek.year } },
                { year: targetWeek.year, week: { lt: targetWeek.week } },
            ],
        },
        orderBy: [{ year: "desc" }, { week: "desc" }],
        take: activeMenus.length,
        select: {
            id: true,
            week: true,
            year: true,
            menuId: true,
        },
    });

    if (priorSchedules.length === 0) {
        return activeMenus[0]!;
    }

    // Check if any active menu was unused in the past N weeks window
    const pastMenuIds = priorSchedules.map((s) => s.menuId);
    const unused = activeMenus.filter((m) => !pastMenuIds.includes(m.id));

    if (unused.length > 0) {
        return unused[0]!;
    }

    // All active menus were used in the past window; advance to the next menu in sequence from the last scheduled menu
    const lastScheduledMenuId = priorSchedules[0]!.menuId;
    const lastIndex = activeMenus.findIndex((m) => m.id === lastScheduledMenuId);
    const nextIndex = lastIndex >= 0 ? (lastIndex + 1) % activeMenus.length : 0;

    return activeMenus[nextIndex]!;
}

export async function scheduleWeeklyMenu(targetWeek: { week: number; year: number }) {
    const activeMenus = await prisma.menus.findMany({
        where: { isActive: true },
        select: { id: true, order: true },
        orderBy: { order: "asc" },
    });

    if (activeMenus.length === 0) {
        throw new Error("No active menus available to schedule");
    }

    const assignedMenu = await getNextCycleMenu(activeMenus, targetWeek);

    const existingSchedule = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
        week: targetWeek.week,
        year: targetWeek.year,
    });

    if (existingSchedule) {
        return `Week ${targetWeek.week}/${targetWeek.year} already has a menu schedule`;
    }

    await weekMenuScheduleService.createWeekMenuSchedule({
        menuId: assignedMenu.id,
        week: targetWeek.week,
        year: targetWeek.year,
    });

    return `Successfully scheduled menu for week ${targetWeek.week}/${targetWeek.year}`;
}

export async function activateWeeklyMenu(targetWeek: { week: number; year: number }) {
    const correctWeekMenu = await weekMenuScheduleService.getWeekMenuScheduleByWeekAndYear({
        week: targetWeek.week,
        year: targetWeek.year,
    });

    if (!correctWeekMenu) {
        return `No week menu schedule exists for week ${targetWeek.week}/${targetWeek.year}`;
    }

    const activeWeekMenus = await weekMenuScheduleService.getActiveWeekMenuSchedules();
    const [onlyActiveWeekMenu] = activeWeekMenus;

    if (onlyActiveWeekMenu && activeWeekMenus.length === 1 && onlyActiveWeekMenu.id === correctWeekMenu.id) {
        return `Week menu for ${targetWeek.week}/${targetWeek.year} is already active`;
    }

    await weekMenuScheduleService.switchActiveWeekMenuSchedule(correctWeekMenu.id);

    await notificationService.notifyUsers({
        allActiveUsers: true,
        title: "Meal selection window open",
        description: `The meal selection window is now open. You can select your meals now.`,
        type: NotificationType.SELECTION_WINDOW_OPEN,
    });

    return `Week menu for ${targetWeek.week}/${targetWeek.year} successfully activated`;
}

export async function autoSubmitUserPreferences(targetScheduleId?: number) {
    let activeWeekMenu;
    if (targetScheduleId) {
        activeWeekMenu = await prisma.weekMenuSchedule.findUnique({
            where: {
                id: targetScheduleId,
            },
            select: {
                id: true,
                week: true,
                year: true,
                menuId: true,
            },
        });
    } else {
        activeWeekMenu = await prisma.weekMenuSchedule.findFirst({
            where: {
                status: WeekMenuStatus.ACTIVE,
            },
            select: {
                id: true,
                week: true,
                year: true,
                menuId: true,
            },
        });
    }

    if (!activeWeekMenu) {
        throw new Error("No active week menu schedule found");
    }

    const { weekStart, weekEnd } = getWeekRange(
        activeWeekMenu.week,
        activeWeekMenu.year,
    );

    const users = await prisma.userPreferences.findMany({
        where: {
            autoSubmitPreset: true,

            user: {
                status: "ACTIVE",
                presets: {
                    some: {
                        isDefault: true,
                        menuId: activeWeekMenu.menuId,
                    },
                },
            },
        },
        select: {
            userId: true,

            user: {
                select: {
                    presets: {
                        where: {
                            isDefault: true,
                            menuId: activeWeekMenu.menuId,
                        },
                        take: 1,
                        select: {
                            presetItems: {
                                select: {
                                    menuDayId: true,
                                    dayMealId: true,
                                    menuDay: {
                                        select: {
                                            day: true,
                                        },
                                    },
                                },
                            },
                        },
                    },

                    userAvailability: {
                        where: {
                            startDate: {
                                lte: weekEnd,
                            },
                            endDate: {
                                gte: weekStart,
                            },
                        },
                        select: {
                            startDate: true,
                            endDate: true,
                        },
                    },
                },
            },
        },
    });

    if (users.length === 0) {
        return "No users with auto-submit presets found";
    }

    const selections = [];

    for (const user of users) {
        const preset = user.user.presets[0];

        if (!preset || preset.presetItems.length === 0) {
            continue;
        }

        const unavailableDays = getUnavailableDays(
            weekStart,
            weekEnd,
            user.user.userAvailability,
        );

        for (const item of preset.presetItems) {
            const isUnavailable = unavailableDays.has(
                item.menuDay.day,
            );

            selections.push({
                menuDayId: item.menuDayId,
                dayMealId: isUnavailable 
                    ? null
                    : item.dayMealId,
                weekMenuScheduleId: activeWeekMenu.id,
                createdBy: user.userId,
                createdFor: user.userId,
                guestCount: 1,
                selectionStatus: SelectionStatus.PENDING,
                selectionType: isUnavailable
                    ? SelectionType.UNAVAILABLE
                    : SelectionType.MEAL,
            });
        }
    }

    if (selections.length === 0) {
        return `Found ${users.length} user(s) with autoSubmitPreset enabled, but no valid preset items to submit`;
    }

    const created = await prisma.selections.createMany({
        data: selections,
        skipDuplicates: true,
    });

    if (users.length > 0) {
        await notificationService.notifyUsers({
            recipientIds: users.map((user) => user.userId),
            title: "Preset submitted",
            description: `Your preset was automatically submitted for this week.`,
            type: NotificationType.MEAL_SELECTED_CONFIRMATION,
            preFiltered: true,
        });
    }

    return `Auto-submitted ${created.count} preset selection(s) for ${users.length} user(s) on week ${activeWeekMenu.week}/${activeWeekMenu.year}`;
}

export async function updateBiWeeklyTasteProfiles() {
    const currentWeekInfo = getISOWeekInfo(new Date());

    if (currentWeekInfo.week % 2 !== 0) {
        return `Skipped: Taste profile updates run on even ISO weeks only (current week: ${currentWeekInfo.week})`;
    }

    const updatedProfiles = await tasteProfileService.updateActiveUsersTasteProfiles(currentWeekInfo.year);
    return `Updated ${updatedProfiles.length} active user taste profiles for week ${currentWeekInfo.week}/${currentWeekInfo.year}`;
}
