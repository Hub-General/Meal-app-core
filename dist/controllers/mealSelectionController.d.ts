import { Request, Response } from "express";
export declare const mealSelectionController: {
    getAllSelectionsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionsByDateRangeController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionByIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionsByUserIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionsByMealIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getWeeklySelectionsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getWeeklySelectionsByUserController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    submitSelectionsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUsersWithoutSelectionsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    adminOverrideSelectionsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    replaceWeeklyMealController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    replaceWeeklyMealsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateWeeklySelectionsStatusController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=mealSelectionController.d.ts.map