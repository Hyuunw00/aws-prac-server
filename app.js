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

app.post("/upload", upload.array("photos"), (req, res) => {
  res.send(req.files);
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
