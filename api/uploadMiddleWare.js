import { v2 as cloudinary } from 'cloudinary'; // Importando `v2` directamente de cloudinary
import multer from "multer";
import dotenv from 'dotenv';
import path from "path";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadDependence = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = uploadDependence.array("files", 10) // o la cantidad máxima que quieras;

export async function uploadToCloudinary(buffer, originalName) {
    return new Promise((resolve, reject) => {
        const config = {
            folder: "SGA_imgs",     // cambia si quieres
            resource_type: "auto",
            public_id: path.parse(originalName).name + "-" + Date.now()
        };

        const stream = cloudinary.uploader.upload_stream(config, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });

        stream.end(buffer);
    });
}