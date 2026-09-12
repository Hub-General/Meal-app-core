import { Request, Response } from "express";
import {
  createBudgetSchema,
  getBudgetsQuerySchema,
  updateBudgetSchema,
} from "../schema/budget";
import { budgetService } from "../services/budgetService";

export const budgetController = {
  createBudgetController: async (req: Request, res: Response) => {
    try {
      const parsed = createBudgetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid budget payload",
          errors: parsed.error.flatten(),
        });
      }

      const budget = await budgetService.createBudget(parsed.data);
      return res.status(201).json(budget);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to create budget",
        error: error.message || error,
      });
    }
  },

  updateBudgetController: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }

      const parsed = updateBudgetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid budget update payload",
          errors: parsed.error.flatten(),
        });
      }

      const existing = await budgetService.getBudgetById(id);
      if (!existing) {
        return res.status(404).json({ message: "Budget not found" });
      }

      const updated = await budgetService.updateBudget(id, parsed.data);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to update budget",
        error: error.message || error,
      });
    }
  },

  getBudgetByIdController: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }

      const budget = await budgetService.getBudgetById(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      return res.status(200).json(budget);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve budget",
        error: error.message || error,
      });
    }
  },

  getAllBudgetsController: async (req: Request, res: Response) => {
    try {
      const parsedQuery = getBudgetsQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: parsedQuery.error.flatten(),
        });
      }

      const budgets = await budgetService.getBudgets(parsedQuery.data);
      return res.status(200).json(budgets);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve budgets",
        error: error.message || error,
      });
    }
  },

  getActiveBudgetController: async (req: Request, res: Response) => {
    try {
      const date = req.query.date ? new Date(String(req.query.date)) : new Date();
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date parameter" });
      }

      const budget = await budgetService.getActiveBudget(date);
      if (!budget) {
        return res.status(404).json({ message: "No budget found" });
      }

      return res.status(200).json(budget);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve active budget",
        error: error.message || error,
      });
    }
  },
};
