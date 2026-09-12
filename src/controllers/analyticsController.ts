import { Request, Response } from "express";
import { analyticsQuerySchema } from "../schema/analytics";
import { analyticsService } from "../services/analyticsService";

export const analyticsController = {
  getDashboardAnalyticsController: async (req: Request, res: Response) => {
    try {
      const parsedQuery = analyticsQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          message: "Invalid analytics query parameters",
          errors: parsedQuery.error.flatten(),
        });
      }

      const analytics = await analyticsService.getDashboardAnalytics(parsedQuery.data);
      return res.status(200).json(analytics);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve analytics data",
        error: error.message || error,
      });
    }
  },
};
