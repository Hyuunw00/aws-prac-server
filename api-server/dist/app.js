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
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const data_source_1 = require("./data-source");
const Image_1 = require("./entity/Image");
dotenv.config();
const app = (0, express_1.default)();
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
app.post("/upload", upload.array("photos"), async (req, res) => {
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
