import crypto from "crypto";
import { uploadFile, deleteFile, getPublicUrl } from "../config/supabaseStorage";

export const imageUploadService = {
    uploadImage: async (
        file: Express.Multer.File,
        folder: string,
        filename?: string
    ) => {
        const extension = file.originalname.split(".").pop();
        const imageName = filename ?? `${crypto.randomUUID()}.${extension}`;
        const path = `${folder}/${imageName}`;

        const storedPath = await uploadFile(path, file.buffer, file.mimetype);

        return {
            path: storedPath,
            url: getPublicUrl(storedPath),
        };
    },

    deleteImage: async (path: string) => {
        await deleteFile(path);
    },

    getImageUrl: (path: string): string => {
        return getPublicUrl(path);
    },
};