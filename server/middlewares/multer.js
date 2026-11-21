import multer from "multer";
import { v4 as uuid } from "uuid";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const privateImageTempDir = mkdtempSync(path.join(os.tmpdir(), "lms-images-"));
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const imageUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, privateImageTempDir);
    },
    filename(req, file, cb) {
      cb(null, uuid());
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(new Error("Please choose a JPEG, PNG, WebP, or GIF image"));
    }
    cb(null, true);
  },
}).single("file");

export function uploadFiles(req, res, next) {
  imageUpload(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 10 MB or smaller"
        : error.message;
    return res.status(400).json({ message });
  });
}

const privateTempDir = mkdtempSync(path.join(os.tmpdir(), "lms-videos-"));
const allowedVideoTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "video/x-m4v",
]);
const videoUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, privateTempDir);
    },
    filename(req, file, cb) {
      cb(null, uuid());
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GiB
  fileFilter(req, file, cb) {
    if (!allowedVideoTypes.has(file.mimetype)) {
      return cb(new Error("Please choose an MP4, WebM, MOV, or Ogg video"));
    }
    cb(null, true);
  },
}).single("file");

export function uploadVideo(req, res, next) {
  videoUpload(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Video must be 1 GiB or smaller"
        : error.message;
    return res.status(400).json({ message });
  });
}
