import { Courses, availableCourseFilter } from "../models/Courses.js";

export async function publicCourseImages(req, res, next) {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return res.sendStatus(404);
    }
    const name = decodeURIComponent(req.path).slice(1);
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(name)) {
      return res.sendStatus(404);
    }
    const image = await Courses.exists({
      ...availableCourseFilter,
      image: { $in: [`uploads/${name}`, `uploads\\${name}`] },
    });
    if (!image) return res.sendStatus(404);
    return next();
  } catch (error) {
    if (error instanceof URIError) return res.sendStatus(404);
    return next(error);
  }
}
