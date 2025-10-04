import "reflect-metadata";
import * as dotenv from "dotenv";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import multerS3 from "multer-s3";
import { AppDataSource } from "./data-source";
import { Image } from "./entity/Image";

dotenv.config();

const app = express();

// CORS 설정 - 특정 origin만 허용
const corsOptions = {
  origin: [
    "http://localhost:5173", // 클라이언트 로컬 개발 도메인
    "https://theo-test.com", // 클라이언트 프로덕션 도메인
  ],
  credentials: true, // 쿠키 전송 허용
};

app.use(cors(corsOptions));
app.use(express.json());
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
  "/images",
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

app.get("/images", async (_req: Request, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const images = await AppDataSource.manager.find(Image, {
      order: {
        createdAt: "DESC",
      },
    });

    res.json({
      success: true,
      count: images.length,
      images: images,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch images",
    });
  }
});

app.get("/images/:id", async (req: Request, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const id = parseInt(req.params.id);
    const image = await AppDataSource.manager.findOne(Image, {
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
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch image",
    });
  }
});

app.put(
  "/images/:id",
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const id = parseInt(req.params.id);
      const file = req.file as Express.MulterS3.File;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      const image = await AppDataSource.manager.findOne(Image, {
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
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: oldKey,
        };
        const command = new DeleteObjectCommand(deleteParams);
        await s3.send(command);
      }

      // 새 파일 정보로 업데이트
      image.name = file.originalname;
      image.url = file.location;

      const updatedImage = await AppDataSource.manager.save(image);

      res.json({
        success: true,
        message: "Image updated successfully",
        image: updatedImage,
      });
    } catch (error) {
      console.error("Error updating image:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update image",
      });
    }
  }
);

app.delete("/images/:id", async (req: Request, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const id = parseInt(req.params.id);
    const image = await AppDataSource.manager.findOne(Image, {
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
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      };
      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command);
    }

    await AppDataSource.manager.remove(image);

    res.json({
      success: true,
      message: "Image deleted successfully",
      deletedImage: {
        id: id,
        name: image.name,
        url: image.url,
      },
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete image",
    });
  }
});

app.listen(port, async () => {
  try {
    await AppDataSource.initialize();
    console.log("DB 연결 성공!");
  } catch (err) {
    console.log("DB 연결 X", err);
  }
  console.log(`Example app listening on port ${port}`);
});
