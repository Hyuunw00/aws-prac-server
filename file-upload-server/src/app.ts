import "reflect-metadata";
import * as dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import express, { Request, Response } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { AppDataSource } from "./data-source";
import { Image } from "./entity/Image";

dotenv.config();

const app = express();
const port = 80;

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: "ap-northeast-2",
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET!,
    key: function (_req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

app.get("/", async (_req: Request, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("DB 연결 성공!");
    res.send("DB 연결 성공!");
  } catch (err) {
    console.log("DB 연결 X", err);
    res.status(500).send("DB 연결 X");
  }
});

app.post(
  "/upload",
  upload.array("photos"),
  async (req: Request, res: Response) => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const uploadedFiles = [];
      const files = req.files as Express.MulterS3.File[];

      for (const file of files) {
        const image = new Image();
        image.name = file.originalname;
        image.url = file.location;

        const savedImage = await AppDataSource.manager.save(image);
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
    } catch (error) {
      console.error("Error saving to database:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save file information to database",
      });
    }
  }
);

app.listen(port, async () => {
  try {
    await AppDataSource.initialize();
    console.log("DB 연결 성공!");
  } catch (err) {
    console.log("DB 연결 X", err);
  }
  console.log(`Example app listening on port ${port}`);
});
