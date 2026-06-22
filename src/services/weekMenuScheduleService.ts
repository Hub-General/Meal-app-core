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
    }
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

    updateWeekMenuSchedule: async(id: number, menuId: number)=>{
        return await prisma.weekMenuSchedule.update({
            where: {id},
            data: {menuId},
            select: weekMenuScheduleSelectShape
        });
    }
}