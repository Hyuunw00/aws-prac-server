"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const client_s3_1 = require("@aws-sdk/client-s3");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const data_source_1 = require("./data-source");
const Image_1 = require("./entity/Image");
dotenv.config();
const app = (0, express_1.default)();
// CORS 설정 - 특정 origin만 허용
const corsOptions = {
    origin: [
        "http://localhost:5173", // 클라이언트 로컬 개발 도메인
        "https://theo-test.com", // 클라이언트 프로덕션 도메인
    ],
    credentials: true, // 쿠키 전송 허용
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
const port = 80;
const s3 = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: "ap-northeast-2",
});
const upload = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        key: function (_req, file, cb) {
            cb(null, file.originalname);
        },
    }),
});
app.get("/", async (_req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        console.log("DB 연결 성공!");
        res.send("DB 연결 성공!");
    }
    catch (err) {
        console.log("DB 연결 X", err);
        res.status(500).send("DB 연결 X");
    }
});
app.post("/images", upload.array("photos"), async (req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const uploadedFiles = [];
        const files = req.files;
        for (const file of files) {
            const image = new Image_1.Image();
            image.name = file.originalname;
            image.url = file.location;
            const savedImage = await data_source_1.AppDataSource.manager.save(image);
            console.log("fileRecord", savedImage);
            uploadedFiles.push({
                id: savedImage.id,
                name: savedImage.name,
                url: savedImage.url,
                createdAt: savedImage.createdAt,
                updatedAt: savedImage.updatedAt,
            });
        }
        res.json({
            success: true,
            message: "파일 업로드 성공",
            count: uploadedFiles.length,
            files: uploadedFiles,
        });
    }
    catch (error) {
        console.error("Error saving to database:", error);
        res.status(500).json({
            success: false,
            error: "Failed to save file information to database",
        });
    }
});
app.get("/images", async (_req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const images = await data_source_1.AppDataSource.manager.find(Image_1.Image, {
            order: {
                createdAt: "DESC",
            },
        });
        res.json({
            success: true,
            count: images.length,
            images: images,
        });
    }
    catch (error) {
        console.error("Error fetching images:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch images",
        });
    }
});
app.get("/images/:id", async (req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const id = parseInt(req.params.id);
        const image = await data_source_1.AppDataSource.manager.findOne(Image_1.Image, {
            where: { id },
        });
        if (!image) {
            return res.status(404).json({
                success: false,
                error: "Image not found",
            });
        }
        res.json({
            success: true,
            image: image,
        });
    }
    catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch image",
        });
    }
});
app.put("/images/:id", upload.single("photo"), async (req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const id = parseInt(req.params.id);
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                error: "No image file provided",
            });
        }
        const image = await data_source_1.AppDataSource.manager.findOne(Image_1.Image, {
            where: { id },
        });
        if (!image) {
            return res.status(404).json({
                success: false,
                error: "Image not found",
            });
        }
        // 기존 S3 파일 삭제
        const oldKey = image.url.split("/").pop();
        if (oldKey) {
            const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: oldKey,
            };
            const command = new client_s3_1.DeleteObjectCommand(deleteParams);
            await s3.send(command);
        }
        // 새 파일 정보로 업데이트
        image.name = file.originalname;
        image.url = file.location;
        const updatedImage = await data_source_1.AppDataSource.manager.save(image);
        res.json({
            success: true,
            message: "Image updated successfully",
            image: updatedImage,
        });
    }
    catch (error) {
        console.error("Error updating image:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update image",
        });
    }
});
app.delete("/images/:id", async (req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const id = parseInt(req.params.id);
        const image = await data_source_1.AppDataSource.manager.findOne(Image_1.Image, {
            where: { id },
        });
        if (!image) {
            return res.status(404).json({
                success: false,
                error: "Image not found",
            });
        }
        const key = image.url.split("/").pop();
        if (key) {
            const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
            };
            const command = new client_s3_1.DeleteObjectCommand(deleteParams);
            await s3.send(command);
        }
        await data_source_1.AppDataSource.manager.remove(image);
        res.json({
            success: true,
            message: "Image deleted successfully",
            deletedImage: {
                id: id,
                name: image.name,
                url: image.url,
            },
        });
    }
    catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete image",
        });
    }
});
app.listen(port, async () => {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log("DB 연결 성공!");
    }
    catch (err) {
        console.log("DB 연결 X", err);
    }
    console.log(`Example app listening on port ${port}`);
});
