import { Status, WeekMenuStatus } from "../generated/prisma";
import { WeekMenuScheduleCreateRequest, WeekMenuScheduleUpdateRequest } from "../schema/weekMenuSchedule";
import { prisma } from "../prisma/client";
import { WeekAndYearRequest } from "../schema/common/commonSchema";

const weekMenuScheduleSelectShape = {
    id: true,
    week: true,
    year: true,
    menu: {
        select: {
            id: true,
            title: true,
        }
    },
    status: true,
    closedAt: true,
    excludedUserIds: true,
};

async function getCurrentInactiveUserIds(): Promise<number[]> {
    const inactiveUsers = await prisma.users.findMany({
        where: { status: { not: Status.ACTIVE } },
        select: { id: true },
    });
    return inactiveUsers.map((u) => u.id);
}

export const weekMenuScheduleService = {
    getAllWeekMenuSchedules: async()=>{
        return await prisma.weekMenuSchedule.findMany({
            select: weekMenuScheduleSelectShape
        });
    },

    getWeekMenuScheduleById: async(id: number)=>{
        return await prisma.weekMenuSchedule.findUnique({
            where: {id},
            select: weekMenuScheduleSelectShape
        });
    },

    getWeekMenuScheduleByWeekAndYear: async({ week, year }: WeekAndYearRequest)=>{
        return await prisma.weekMenuSchedule.findFirst({
            where: {week, year},
            select: weekMenuScheduleSelectShape
        });
    },

    getActiveWeekMenuSchedule: async()=>{
        return await prisma.weekMenuSchedule.findFirst({
            where: {status: WeekMenuStatus.ACTIVE},
            select: weekMenuScheduleSelectShape
        })
    },

    getActiveWeekMenuSchedules: async()=>{
        return await prisma.weekMenuSchedule.findMany({
            where: {status: WeekMenuStatus.ACTIVE},
            select: weekMenuScheduleSelectShape
        })
    },

    getWeekMenuSchedulesByMenu: async(menuId: number)=>{
        return await prisma.weekMenuSchedule.findMany({
            where: {menuId},
            select: weekMenuScheduleSelectShape
        });
    },

    createWeekMenuSchedule: async(weekMenuScheduleData: WeekMenuScheduleCreateRequest)=>{
        const excludedUserIds = weekMenuScheduleData.excludedUserIds != null
            ? [...new Set(weekMenuScheduleData.excludedUserIds)]
            : await getCurrentInactiveUserIds();

        return await prisma.weekMenuSchedule.create({
            data: {
                week: weekMenuScheduleData.week,
                year: weekMenuScheduleData.year,
                menuId: weekMenuScheduleData.menuId,
                excludedUserIds,
            },
            select: weekMenuScheduleSelectShape
        });
    },

    updateWeekMenuSchedule: async(id: number, data: WeekMenuScheduleUpdateRequest)=>{
        const updatePayload: WeekMenuScheduleUpdateRequest = {
            ...data,
            ...(data.excludedUserIds !== undefined
                ? { excludedUserIds: [...new Set(data.excludedUserIds)] }
                : {}),
        };

        return await prisma.weekMenuSchedule.update({
            where: {id},
            data: updatePayload,
            select: weekMenuScheduleSelectShape
        });
    },

    activateWeekMenuSchedule: async(id: number)=>{
        const [schedule, inactiveUserIds] = await Promise.all([
            prisma.weekMenuSchedule.findUnique({
                where: { id },
                select: { excludedUserIds: true },
            }),
            getCurrentInactiveUserIds(),
        ]);

        const mergedExcludedIds = [
            ...new Set([...(schedule?.excludedUserIds ?? []), ...inactiveUserIds]),
        ];

        return await prisma.weekMenuSchedule.update({
            where:{id},
            data: {
                status: WeekMenuStatus.ACTIVE,
                excludedUserIds: mergedExcludedIds,
            },
            select: weekMenuScheduleSelectShape
        })
    },

    switchActiveWeekMenuSchedule: async(targetWeekMenuScheduleId: number)=>{
        const [targetSchedule, inactiveUserIds] = await Promise.all([
            prisma.weekMenuSchedule.findUnique({
                where: { id: targetWeekMenuScheduleId },
                select: { excludedUserIds: true },
            }),
            getCurrentInactiveUserIds(),
        ]);

        const mergedExcludedIds = [
            ...new Set([...(targetSchedule?.excludedUserIds ?? []), ...inactiveUserIds]),
        ];

        return await prisma.$transaction(async (tx) => {
            await tx.weekMenuSchedule.updateMany({
                where: {
                    status: WeekMenuStatus.ACTIVE,
                    id: { not: targetWeekMenuScheduleId },
                },
                data: { status: WeekMenuStatus.CLOSED, closedAt: new Date() },
            });

            return await tx.weekMenuSchedule.update({
                where:{id: targetWeekMenuScheduleId},
                data: {
                    status: WeekMenuStatus.ACTIVE,
                    excludedUserIds: mergedExcludedIds,
                },
                select: weekMenuScheduleSelectShape
            });
        });
    },

    setWeekMenuScheduleStatus: async(id: number, status: WeekMenuStatus)=>{
        return await prisma.weekMenuSchedule.update({
            where:{id},
            data: {status},
            select: weekMenuScheduleSelectShape
        })
    },

}
