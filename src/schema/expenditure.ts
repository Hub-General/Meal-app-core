import { z } from "zod";
import { ExpenditureType } from "../generated/prisma";

export const createExpenditureSchema = z
  .object({
    type: z.nativeEnum(ExpenditureType).default(ExpenditureType.MEAL),
    cost: z.number().min(0, "Cost must be a non-negative number"),
    startDate: z.coerce.date({ message: "Invalid startDate" }),
    endDate: z.coerce.date({ message: "Invalid endDate" }),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export const updateExpenditureSchema = z
  .object({
    type: z.nativeEnum(ExpenditureType).optional(),
    cost: z.number().min(0, "Cost must be a non-negative number").optional(),
    startDate: z.coerce.date({ message: "Invalid startDate" }).optional(),
    endDate: z.coerce.date({ message: "Invalid endDate" }).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "startDate must be before or equal to endDate",
      path: ["endDate"],
    }
  );

export const getExpendituresQuerySchema = z.object({
  date: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: z.nativeEnum(ExpenditureType).optional(),
});

export type CreateExpenditureDto = z.infer<typeof createExpenditureSchema>;
export type UpdateExpenditureDto = z.infer<typeof updateExpenditureSchema>;
export type GetExpendituresQueryDto = z.infer<typeof getExpendituresQuerySchema>;
