import { Request, Response } from "express";
export declare const mealController: {
    createMealController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createMealBatchController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllMealsController: (req: Request, res: Response) => Promise<void>;
    getMealByIdController: (req: Request, res: Response) => Promise<void>;
    updateMealController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteMealController: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=mealController.d.ts.map