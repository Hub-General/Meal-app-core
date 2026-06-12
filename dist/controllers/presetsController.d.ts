import { Request, Response } from "express";
export declare const presetController: {
    getAllPresetsController: (req: Request, res: Response) => Promise<void>;
    getPresetbyIdController: (req: Request, res: Response) => Promise<void>;
    getPresetsByUserIdController: (req: Request, res: Response) => Promise<void>;
    createPresetController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updatePresetController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getPresetItemsByPresetIdController: (req: Request, res: Response) => Promise<void>;
    createPresetItemController: (req: Request, res: Response) => Promise<void>;
    createPresetItemsBatchController: (req: Request, res: Response) => Promise<void>;
    updatePresetItemController: (req: Request, res: Response) => Promise<void>;
    deletePresetItemController: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=presetsController.d.ts.map