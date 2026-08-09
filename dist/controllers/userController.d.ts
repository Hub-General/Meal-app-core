import { Request, Response } from "express";
export declare const userController: {
    getAllUsersController: (req: Request, res: Response) => Promise<void>;
    getUserByIdController: (req: Request, res: Response) => Promise<void>;
    updateUserDetailsController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserPreferencesController: (req: Request, res: Response) => Promise<void>;
    updateUserPreferencesController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=userController.d.ts.map