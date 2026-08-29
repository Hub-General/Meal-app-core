import crypto from "crypto";
import sharp from "sharp";
import { uploadFile, deleteFile, getPublicUrl } from "../config/supabaseStorage";

export const imageUploadService = {
    uploadImage: async (
        file: Express.Multer.File,
        folder: string,
        filename?: string
    ) => {
        let buffer = file.buffer;
        let mimetype = file.mimetype;
        let extension = "webp";

        try {
            // Optimize image: resize to max 600x600 cover and convert to high-performance WebP
            buffer = await sharp(file.buffer)
                .resize(600, 600, { fit: "cover", position: "center" })
                .webp({ quality: 80, effort: 4 })
                .toBuffer();
            mimetype = "image/webp";
        } catch (err) {
            console.warn("Sharp image optimization failed, uploading original buffer:", err);
            extension = file.originalname ? file.originalname.split(".").pop() || "jpg" : "jpg";
        }

        const imageName = filename ?? `${crypto.randomUUID()}.${extension}`;
        const path = `${folder}/${imageName}`;

        const storedPath = await uploadFile(path, buffer, mimetype);

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