import { WeekMenuStatus } from "../generated/prisma";
import { WeekMenuScheduleCreateRequest } from "../interfaces/weekMenuSchedule";
import { prisma } from "../prisma/client";

const weekMenuScheduleSelectShape = {
    id: true,
    week: true,
    year: true,
    menu: {
        select: {
            id: true,
            name: true,
        }
    },
    status: true
}

interface WeekMenuDataUpdateRequest {
    menuId: number,
    status: WeekMenuStatus,
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

    getWeekMenuScheduleByWeekAndYear: async(week: number, year: number)=>{
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
        return await prisma.weekMenuSchedule.create({
            data: weekMenuScheduleData,
            select: weekMenuScheduleSelectShape
        });
    },

    updateWeekMenuSchedule: async(id: number, data: WeekMenuDataUpdateRequest)=>{
        return await prisma.weekMenuSchedule.update({
            where: {id},
            data: data,
            select: weekMenuScheduleSelectShape
        });
    },

    activateWeekMenuSchedule: async(id: number)=>{
        return await prisma.weekMenuSchedule.update({
            where:{id},
            data: {status: WeekMenuStatus.ACTIVE},
            select: weekMenuScheduleSelectShape
        })
    },

    switchActiveWeekMenuSchedule: async(targetWeekMenuScheduleId: number)=>{
        return await prisma.$transaction(async (tx) => {
            await tx.weekMenuSchedule.updateMany({
                where: {
                    status: WeekMenuStatus.ACTIVE,
                    id: { not: targetWeekMenuScheduleId },
                },
                data: { status: WeekMenuStatus.CLOSED },
            });

            return await tx.weekMenuSchedule.update({
                where:{id: targetWeekMenuScheduleId},
                data: {status: WeekMenuStatus.ACTIVE},
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
