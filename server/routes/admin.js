import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  addLectures,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllStats,
  getAllUser,
  getPendingCourseDeletions,
  updateRole,
} from "../controllers/admin.js";
import { uploadFiles, uploadVideo } from "../middlewares/multer.js";

const router = express.Router();

router.post("/course/new", isAuth, isAdmin, uploadFiles, createCourse);
router.post("/course/:id", isAuth, isAdmin, uploadVideo, addLectures);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse);
router.get(
  "/admin/pending-course-deletions",
  isAuth,
  isAdmin,
  getPendingCourseDeletions,
);
router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);
router.get("/stats", isAuth, isAdmin, getAllStats);
router.put("/user/:id", isAuth, updateRole);
router.get("/users", isAuth, isAdmin, getAllUser);

export default router;
