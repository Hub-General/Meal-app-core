import { Request, Response } from "express";
import {
  createExpenditureSchema,
  getExpendituresQuerySchema,
  updateExpenditureSchema,
} from "../schema/expenditure";
import { budgetService } from "../services/budgetService";

export const expenditureController = {
  createExpenditureController: async (req: Request, res: Response) => {
    try {
      const parsed = createExpenditureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid expenditure payload",
          errors: parsed.error.flatten(),
        });
      }

      const expenditure = await budgetService.createExpenditure(parsed.data);
      return res.status(201).json(expenditure);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to create expenditure period",
        error: error.message || error,
      });
    }
  },

  updateExpenditureController: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expenditure ID" });
      }

      const parsed = updateExpenditureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid expenditure update payload",
          errors: parsed.error.flatten(),
        });
      }

      const existing = await budgetService.getExpenditureById(id);
      if (!existing) {
        return res.status(404).json({ message: "Expenditure period not found" });
      }

      const updated = await budgetService.updateExpenditure(id, parsed.data);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to update expenditure period",
        error: error.message || error,
      });
    }
  },

  getExpenditureByIdController: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expenditure ID" });
      }

      const expenditure = await budgetService.getExpenditureById(id);
      if (!expenditure) {
        return res.status(404).json({ message: "Expenditure period not found" });
      }

      return res.status(200).json(expenditure);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve expenditure period",
        error: error.message || error,
      });
    }
  },

  getAllExpendituresController: async (req: Request, res: Response) => {
    try {
      const parsedQuery = getExpendituresQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: parsedQuery.error.flatten(),
        });
      }

      const expenditures = await budgetService.getExpenditures(parsedQuery.data);
      return res.status(200).json(expenditures);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve expenditure periods",
        error: error.message || error,
      });
    }
  },

  getActiveExpenditureController: async (req: Request, res: Response) => {
    try {
      const date = req.query.date ? new Date(String(req.query.date)) : new Date();
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date parameter" });
      }

      const expenditure = await budgetService.getActiveExpenditure(date);
      if (!expenditure) {
        return res.status(404).json({ message: "No expenditure period found" });
      }

      return res.status(200).json(expenditure);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve active expenditure period",
        error: error.message || error,
      });
    }
  },
};
