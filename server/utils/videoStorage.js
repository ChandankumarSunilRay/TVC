import { createReadStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client;
function getConfig() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!region || !bucket) {
    throw new Error(
      "Set AWS_REGION and AWS_S3_BUCKET in the server environment",
    );
  }
  client ||= new S3Client({ region });
  return { client, bucket };
}

export const VIDEO_URL_SECONDS = 15 * 60;
export const IMAGE_URL_SECONDS = 60 * 60;

async function uploadObject({ filePath, fileSize, contentType, key }) {
  const { client: s3, bucket } = getConfig();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentLength: fileSize,
      ContentType: contentType,
      ContentDisposition: "inline",
    }),
  );
  return key;
}

export const videoStorage = {
  async upload({ filePath, fileSize, contentType, courseId, originalName }) {
    const extension = path
      .extname(originalName)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, "");
    const key = `lectures/${courseId}/${randomUUID()}${extension}`;
    return uploadObject({ filePath, fileSize, contentType, key });
  },

  async getWatchUrl(key) {
    const { client: s3, bucket } = getConfig();
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      {
        expiresIn: VIDEO_URL_SECONDS,
      },
    );
  },

  async remove(key) {
    const { client: s3, bucket } = getConfig();
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};

export const imageStorage = {
  async upload({ filePath, fileSize, contentType, originalName }) {
    const extension = path
      .extname(originalName)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, "");
    const key = `course-images/${randomUUID()}${extension}`;
    return uploadObject({ filePath, fileSize, contentType, key });
  },

  async getUrl(key) {
    const { client: s3, bucket } = getConfig();
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      {
        expiresIn: IMAGE_URL_SECONDS,
      },
    );
  },

  async remove(key) {
    const { client: s3, bucket } = getConfig();
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};
