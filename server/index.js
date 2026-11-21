import express from "express";
import dotenv from "dotenv";
import { connectDb, isDatabaseReady } from "./database/db.js";
import cors from "cors";
import { publicCourseImages } from "./middlewares/publicCourseImages.js";
import { COURSE_IMAGES_DIR } from "./utils/paths.js";
import userRoutes from "./routes/user.js";
import courseRoutes from "./routes/course.js";
import adminRoutes from "./routes/admin.js";
import { getRazorpayCredentials } from "./utils/razorpay.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT;

app.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!isDatabaseReady()) return res.status(503).send("Database unavailable");
  res.send("Server is working");
});

app.use(
  "/uploads",
  publicCourseImages,
  express.static(COURSE_IMAGES_DIR, { index: false }),
);

app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", adminRoutes);

try {
  getRazorpayCredentials();
  await connectDb();
  app.listen(port, () => console.log(`Server listening on port ${port}`));
} catch {
  console.error(
    "Startup failed. Check DB, MongoDB credentials and network access.",
  );
  process.exitCode = 1;
}
