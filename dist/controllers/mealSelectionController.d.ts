import { Request, Response } from "express";
export declare const mealSelectionController: {
    getAllSelectionsController: (req: Request, res: Response) => Promise<void>;
    getSelectionsByDateRangeController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionByIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionsByFilterController: (req: Request, res: Response) => Promise<void>;
    getSelectionsByUserIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionsByMealIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSelectionsByDayController: (req: Request, res: Response) => Promise<void>;
    createSelectionController: (req: Request, res: Response) => Promise<void>;
    createBatchSelectionControleer: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=mealSelectionController.d.ts.map