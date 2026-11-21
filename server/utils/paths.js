import path from "node:path";
import { fileURLToPath } from "node:url";

export const SERVER_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const COURSE_IMAGES_DIR = path.join(SERVER_DIR, "uploads");
