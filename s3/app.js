require("dotenv").config();
const { S3Client } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const app = express();
const { Sequelize } = require("sequelize");
const port = 80;

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: "ap-northeast-2",
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: "mysql",
  }
);

// 기존 테이블 사용 - 컬럼 명시적 정의
const Image = sequelize.define(
  "Image",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    url: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "images",
    timestamps: true, // createdAt, updatedAt 자동 관리
  }
);

app.get("/", async (req, res) => {
  try {
    await sequelize.authenticate();
    console.log("DB 연결 성공!");
    res.send("DB 연결 성공!");
  } catch (err) {
    console.log("DB 연결 X", err);
    res.status(500).send("DB 연결 X");
  }
});

app.post("/upload", upload.array("photos"), async (req, res) => {
  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileRecord = await Image.create({
        name: file.originalname,
        url: file.location,
      });
      console.log("fileRecord", fileRecord);

      uploadedFiles.push({
        id: fileRecord.id,
        name: file.originalname,
        url: file.location,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
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
});

app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    console.log("DB 연결 성공!");
  } catch (err) {
    console.log("DB 연결 X", err);
  }
  console.log(`Example app listening on port ${port}`);
});
