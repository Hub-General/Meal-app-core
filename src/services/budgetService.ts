import { prisma } from "../db/prisma";
import { ExpenditureType, Prisma } from "../generated/prisma";
import {
  CreateBudgetDto,
  GetBudgetsQueryDto,
  UpdateBudgetDto,
} from "../schema/budget";
import {
  CreateExpenditureDto,
  GetExpendituresQueryDto,
  UpdateExpenditureDto,
} from "../schema/expenditure";

export const budgetService = {
  // ==========================================
  // Budget Operations
  // ==========================================

  createBudget: async (data: CreateBudgetDto) => {
    return prisma.budget.create({
      data: {
        title: data.title,
        description: data.description,
        startPeriod: data.startPeriod,
        endPeriod: data.endPeriod,
        amount: data.amount,
      },
    });
  },

  updateBudget: async (id: number, data: UpdateBudgetDto) => {
    return prisma.budget.update({
      where: { id },
      data,
    });
  },

  getBudgetById: async (id: number) => {
    return prisma.budget.findUnique({
      where: { id },
    });
  },

  getBudgets: async (filter?: GetBudgetsQueryDto) => {
    const where: Prisma.BudgetWhereInput = {};

    if (filter?.date) {
      where.startPeriod = { lte: filter.date };
      where.endPeriod = { gte: filter.date };
    } else if (filter?.startDate || filter?.endDate) {
      if (filter.startDate && filter.endDate) {
        where.startPeriod = { lte: filter.endDate };
        where.endPeriod = { gte: filter.startDate };
      } else if (filter.startDate) {
        where.endPeriod = { gte: filter.startDate };
      } else if (filter.endDate) {
        where.startPeriod = { lte: filter.endDate };
      }
    }

    if (filter?.search) {
      where.title = {
        contains: filter.search,
        mode: "insensitive",
      };
    }

    return prisma.budget.findMany({
      where,
      orderBy: { startPeriod: "desc" },
    });
  },

  getActiveBudget: async (date = new Date()) => {
    // 1. Try finding budget currently active for this date
    const active = await prisma.budget.findFirst({
      where: {
        startPeriod: { lte: date },
        endPeriod: { gte: date },
      },
      orderBy: { startPeriod: "desc" },
    });

    if (active) return active;

    // 2. Fallback to latest budget if none explicitly active
    return prisma.budget.findFirst({
      orderBy: { endPeriod: "desc" },
    });
  },

  // ==========================================
  // Expenditure Operations
  // ==========================================

  createExpenditure: async (data: CreateExpenditureDto) => {
    return prisma.expenditurePeriod.create({
      data: {
        type: data.type,
        cost: data.cost,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  },

  updateExpenditure: async (id: number, data: UpdateExpenditureDto) => {
    return prisma.expenditurePeriod.update({
      where: { id },
      data,
    });
  },

  getExpenditureById: async (id: number) => {
    return prisma.expenditurePeriod.findUnique({
      where: { id },
    });
  },

  getExpenditures: async (filter?: GetExpendituresQueryDto) => {
    const where: Prisma.ExpenditurePeriodWhereInput = {};

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.date) {
      where.startDate = { lte: filter.date };
      where.endDate = { gte: filter.date };
    } else if (filter?.startDate || filter?.endDate) {
      if (filter.startDate && filter.endDate) {
        where.startDate = { lte: filter.endDate };
        where.endDate = { gte: filter.startDate };
      } else if (filter.startDate) {
        where.endDate = { gte: filter.startDate };
      } else if (filter.endDate) {
        where.startDate = { lte: filter.endDate };
      }
    }

    return prisma.expenditurePeriod.findMany({
      where,
      orderBy: { startDate: "desc" },
    });
  },

  getActiveExpenditure: async (
    date = new Date(),
    type: ExpenditureType = ExpenditureType.MEAL
  ) => {
    const active = await prisma.expenditurePeriod.findFirst({
      where: {
        type,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { startDate: "desc" },
    });

    if (active) return active;

    return prisma.expenditurePeriod.findFirst({
      where: { type },
      orderBy: { endDate: "desc" },
    });
  },
};