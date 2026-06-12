import { Request, Response } from "express";
export declare const roleController: {
    createRoleController: (req: Request, res: Response) => Promise<void>;
    updateRoleController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllRolesController: (req: Request, res: Response) => Promise<void>;
    getRoleByIdController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=roleController.d.ts.map