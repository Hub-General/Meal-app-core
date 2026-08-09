import { Request, Response } from "express";
export declare const menuController: {
    createMenuController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllMenusController: (req: Request, res: Response) => Promise<void>;
    getMenuByIdController: (req: Request, res: Response) => Promise<void>;
    updateMenuController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteMenuController: (req: Request, res: Response) => Promise<void>;
    getMenuMealsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getMenuDaysByMenuIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createMenuMealsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateMenuMealsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=menuController.d.ts.map