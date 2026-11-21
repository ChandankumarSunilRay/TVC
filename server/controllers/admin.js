import TryCatch from "../middlewares/TryCatch.js";
import { Courses, availableCourseFilter } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import { Progress } from "../models/Progress.js";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { imageStorage, videoStorage } from "../utils/videoStorage.js";
import { COURSE_IMAGES_DIR } from "../utils/paths.js";

export const createCourse = TryCatch(async (req, res) => {
  const { title, description, category, createdBy, duration, price } = req.body;
  const image = req.file;
  if (!image) return res.status(400).json({ message: "Choose a course image" });
  let uploadedKey;
  try {
    uploadedKey = await imageStorage.upload({
      filePath: image.path,
      fileSize: image.size,
      contentType: image.mimetype,
      originalName: image.originalname,
    });
    await Courses.create({
      title,
      description,
      category,
      createdBy,
      duration,
      price,
      image: uploadedKey,
      imageStorage: "s3",
    });
    uploadedKey = undefined;
    res.status(201).json({ message: "Course Created Successfully" });
  } catch (error) {
    if (uploadedKey)
      console.error("Check whether this S3 image needs cleanup:", uploadedKey);
    throw error;
  } finally {
    await unlink(image.path).catch((error) => {
      if (error.code !== "ENOENT")
        console.error("Could not remove a temporary image file.");
    });
  }
});

export const addLectures = TryCatch(async (req, res) => {
  let uploadedKey;
  try {
    const course = await Courses.findOne({
      _id: req.params.id,
      ...availableCourseFilter,
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!req.file) return res.status(400).json({ message: "Choose a video" });

    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    uploadedKey = await videoStorage.upload({
      filePath: req.file.path,
      fileSize: req.file.size,
      contentType: req.file.mimetype,
      courseId: course._id.toString(),
      originalName: req.file.originalname,
    });

    const lecture = await Lecture.create({
      title: title.trim(),
      description: description.trim(),
      video: uploadedKey,
      videoStorage: "s3",
      course: course._id,
    });
    uploadedKey = undefined;
    if (
      !(await Courses.exists({ _id: course._id, ...availableCourseFilter }))
    ) {
      await removeLectureVideo(lecture);
      await lecture.deleteOne();
      return res
        .status(409)
        .json({ message: "Course was removed during upload" });
    }
    res.status(201).json({
      message: "Lecture Added",
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        description: lecture.description,
      },
    });
  } catch (error) {
    if (uploadedKey) {
      console.error("Check whether this S3 video needs cleanup:", uploadedKey);
    }
    throw error;
  } finally {
    if (req.file?.path) {
      await unlink(req.file.path).catch((error) => {
        if (error.code !== "ENOENT")
          console.error("Could not remove a temporary video file.");
      });
    }
  }
});

async function removeLegacyFile(storedPath) {
  const normalized = String(storedPath || "").replaceAll("\\", "/");
  const match = /^uploads\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)$/.exec(normalized);
  if (!match) throw new Error("Invalid old upload path");
  await unlink(path.join(COURSE_IMAGES_DIR, match[1])).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

async function removeLectureVideo(lecture) {
  if (lecture.videoStorage === "s3") {
    await videoStorage.remove(lecture.video);
  } else {
    await removeLegacyFile(lecture.video);
  }
}

export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  await removeLectureVideo(lecture);
  await Progress.updateMany(
    { course: lecture.course, completedLectures: lecture._id },
    { $pull: { completedLectures: lecture._id } },
  );
  await lecture.deleteOne();
  res.json({ message: "Lecture Deleted" });
});

export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findByIdAndUpdate(
    req.params.id,
    { $set: { deletionPending: true } },
    { new: true },
  );
  if (!course) return res.status(404).json({ message: "Course not found" });

  const lectures = await Lecture.find({ course: course._id });
  for (const lecture of lectures) {
    await removeLectureVideo(lecture);
    await lecture.deleteOne();
  }
  if (course.imageStorage === "s3") await imageStorage.remove(course.image);
  else await removeLegacyFile(course.image);
  await Progress.deleteMany({ course: course._id });
  await User.updateMany(
    { subscription: course._id },
    { $pull: { subscription: course._id } },
  );
  await course.deleteOne();

  res.json({ message: "Course Deleted" });
});

export const getPendingCourseDeletions = TryCatch(async (req, res) => {
  const courses = await Courses.find({ deletionPending: true }).select(
    "_id title",
  );
  res.set("Cache-Control", "private, no-store");
  res.json({ courses });
});

export const getAllStats = TryCatch(async (req, res) => {
  const totalCourses = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;
  res.json({
    stats: {
      totalCourses,
      totalCoures: totalCourses,
      totalLectures,
      totalUsers,
    },
  });
});

export const getAllUsers = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    "-password",
  );
  res.json({ users });
});

export const getAllUser = getAllUsers;

export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin") {
    return res
      .status(403)
      .json({ message: "This endpoint is assign to superadmin" });
  }
  const user = await User.findById(req.params.id);
  if (user.role === "user") {
    user.role = "admin";
    await user.save();
    return res.status(200).json({ message: "Role updated to admin" });
  }
  if (user.role === "admin") {
    user.role = "user";
    await user.save();
    return res.status(200).json({ message: "Role updated" });
  }
});
