import { z } from "zod";

export const createBudgetSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional().nullable(),
    startPeriod: z.coerce.date({ message: "Invalid startPeriod date" }),
    endPeriod: z.coerce.date({ message: "Invalid endPeriod date" }),
    amount: z.number().positive("Amount must be a positive number"),
  })
  .refine((data) => data.startPeriod <= data.endPeriod, {
    message: "startPeriod must be before or equal to endPeriod",
    path: ["endPeriod"],
  });

export const updateBudgetSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    description: z.string().trim().optional().nullable(),
    startPeriod: z.coerce.date({ message: "Invalid startPeriod date" }).optional(),
    endPeriod: z.coerce.date({ message: "Invalid endPeriod date" }).optional(),
    amount: z.number().positive("Amount must be a positive number").optional(),
  })
  .refine(
    (data) => {
      if (data.startPeriod && data.endPeriod) {
        return data.startPeriod <= data.endPeriod;
      }
      return true;
    },
    {
      message: "startPeriod must be before or equal to endPeriod",
      path: ["endPeriod"],
    }
  );

export const getBudgetsQuerySchema = z.object({
  date: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().trim().optional(),
});

export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
export type GetBudgetsQueryDto = z.infer<typeof getBudgetsQuerySchema>;
