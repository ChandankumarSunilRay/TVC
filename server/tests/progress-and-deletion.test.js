import test from "node:test";
import assert from "node:assert/strict";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { Progress } from "../models/Progress.js";
import { User } from "../models/User.js";
import { imageStorage, videoStorage } from "../utils/videoStorage.js";
import {
  deleteCourse,
  deleteLecture,
  getPendingCourseDeletions,
} from "../controllers/admin.js";
import {
  addProgress,
  checkout,
  fetchLecture,
  fetchLectures,
  getAllCourses,
  getMyCourses,
  getSingleCourse,
  getYourProgress,
} from "../controllers/course.js";

const courseId = "a".repeat(24);
const lectureId = "b".repeat(24);
const secondId = "c".repeat(24);
const removedId = "d".repeat(24);
const student = { _id: "e".repeat(24), role: "user", subscription: [courseId] };

async function invoke(handler, overrides = {}) {
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    set() {
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await handler(
    {
      params: { id: courseId },
      query: { course: courseId, lectureId },
      user: student,
      ...overrides,
    },
    res,
  );
  return res;
}

test("progress rejects inaccessible courses and foreign or malformed lecture IDs before writing", async (t) => {
  t.mock.method(Courses, "exists", async () => ({ _id: courseId }));
  const lookup = t.mock.method(Lecture, "exists", async (query) => {
    assert.deepEqual(query, { _id: secondId, course: courseId });
    return null;
  });
  const write = t.mock.method(Progress, "findOneAndUpdate", () =>
    assert.fail("unexpected progress write"),
  );
  const outsider = { ...student, subscription: [] };
  assert.equal((await invoke(addProgress, { user: outsider })).statusCode, 403);
  assert.equal(
    (await invoke(getYourProgress, { user: outsider })).statusCode,
    403,
  );
  assert.equal(
    (
      await invoke(addProgress, {
        query: { course: courseId, lectureId: "bad" },
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await invoke(addProgress, {
        query: { course: courseId, lectureId: secondId },
      })
    ).statusCode,
    404,
  );
  assert.equal(lookup.mock.callCount(), 1);
  assert.equal(write.mock.callCount(), 0);
});

test("concurrent completions use an atomic set update and receive credit once", async (t) => {
  t.mock.method(Courses, "exists", async () => ({ _id: courseId }));
  t.mock.method(Lecture, "exists", async () => ({ _id: lectureId }));
  const credited = new Set();
  t.mock.method(
    Progress,
    "findOneAndUpdate",
    async (filter, update, options) => {
      assert.deepEqual(filter, { user: student._id, course: courseId });
      assert.deepEqual(update, { $addToSet: { completedLectures: lectureId } });
      assert.equal(options.new, false);
      const previous = { completedLectures: [...credited] };
      credited.add(update.$addToSet.completedLectures);
      return previous;
    },
  );
  const results = await Promise.all([invoke(addProgress), invoke(addProgress)]);
  assert.deepEqual(results.map((res) => res.statusCode).sort(), [200, 201]);
  assert.deepEqual([...credited], [lectureId]);
});

test("legacy records count only distinct current lectures, even after the last lecture is deleted", async (t) => {
  t.mock.method(Courses, "exists", async () => ({ _id: courseId }));
  t.mock.method(Progress, "find", () => ({
    lean: async () => [
      { completedLectures: [removedId, secondId, secondId] },
      { completedLectures: [lectureId] },
    ],
  }));
  let lectures = [lectureId, secondId].map((_id) => ({ _id }));
  t.mock.method(Lecture, "find", () => ({
    select: () => ({ lean: async () => lectures }),
  }));
  const full = (await invoke(getYourProgress)).body;
  assert.equal(full.allLectures, 2);
  assert.equal(full.completedLectures, 2);
  assert.equal(full.courseProgressPercentage, 100);
  assert.deepEqual(full.progress[0].completedLectures, [lectureId, secondId]);
  lectures = [];
  const empty = (await invoke(getYourProgress)).body;
  assert.equal(empty.completedLectures, 0);
  assert.equal(empty.courseProgressPercentage, 0);
  assert.deepEqual(empty.progress[0].completedLectures, []);
});

test("individual lecture deletion removes the completion from every affected learner", async (t) => {
  const calls = [];
  t.mock.method(Lecture, "findById", async () => ({
    _id: lectureId,
    course: courseId,
    video: "lesson",
    videoStorage: "s3",
    deleteOne: async () => calls.push("lecture"),
  }));
  t.mock.method(videoStorage, "remove", async () => calls.push("media"));
  t.mock.method(Progress, "updateMany", async (filter, update) => {
    assert.deepEqual(filter, {
      course: courseId,
      completedLectures: lectureId,
    });
    assert.deepEqual(update, { $pull: { completedLectures: lectureId } });
    calls.push("progress");
  });
  assert.equal((await invoke(deleteLecture)).statusCode, 200);
  assert.deepEqual(calls, ["media", "progress", "lecture"]);
});

test("interrupted course deletion stays hidden and can resume after storage and database failures", async (t) => {
  let pending = false;
  let exists = true;
  let mediaFailure = true;
  let databaseFailure = true;
  const deletedVideos = [];
  const course = {
    _id: courseId,
    title: "Algorithms",
    imageStorage: "s3",
    image: "thumbnail",
    deleteOne: async () => {
      exists = false;
    },
  };
  const rows = new Map();
  for (const id of [lectureId, secondId]) {
    rows.set(id, {
      _id: id,
      videoStorage: "s3",
      course: courseId,
      video: id,
      deleteOne: async () => rows.delete(id),
    });
  }
  t.mock.method(Courses, "findByIdAndUpdate", async (id, update) => {
    assert.equal(id, courseId);
    assert.deepEqual(update, { $set: { deletionPending: true } });
    pending = true;
    return exists ? course : null;
  });
  t.mock.method(Lecture, "find", async () => [...rows.values()]);
  t.mock.method(Lecture, "findById", async () => rows.get(secondId));
  t.mock.method(videoStorage, "remove", async (key) => {
    assert.ok(pending);
    if (key === secondId && mediaFailure)
      throw new Error("storage unavailable");
    deletedVideos.push(key);
  });
  t.mock.method(imageStorage, "remove", async () => {});
  t.mock.method(Progress, "deleteMany", async (query) =>
    assert.deepEqual(query, { course: courseId }),
  );
  t.mock.method(User, "updateMany", async (query, update) => {
    assert.deepEqual(query, { subscription: courseId });
    assert.deepEqual(update, { $pull: { subscription: courseId } });
    if (databaseFailure) throw new Error("database unavailable");
  });
  const active = (query) => {
    assert.deepEqual(query.deletionPending, { $ne: true });
    return exists && !pending;
  };
  t.mock.method(Courses, "exists", async (query) =>
    active(query) ? { _id: courseId } : null,
  );
  t.mock.method(Courses, "findOne", async (query) =>
    active(query) ? course : null,
  );
  t.mock.method(Courses, "find", (query) => {
    if (query.deletionPending === true) {
      return {
        select: async () =>
          exists && pending ? [{ _id: courseId, title: course.title }] : [],
      };
    }
    return active(query) ? [course] : [];
  });

  const interrupted = await invoke(deleteCourse);
  assert.equal(interrupted.statusCode, 500);
  assert.equal(exists, true);
  assert.deepEqual(deletedVideos, [lectureId]);
  assert.deepEqual((await invoke(getAllCourses)).body.courses, []);
  assert.deepEqual((await invoke(getMyCourses)).body.courses, []);
  assert.deepEqual((await invoke(getPendingCourseDeletions)).body.courses, [
    { _id: courseId, title: course.title },
  ]);
  for (const handler of [
    getSingleCourse,
    checkout,
    fetchLectures,
    fetchLecture,
    getYourProgress,
    addProgress,
  ]) {
    assert.equal((await invoke(handler)).statusCode, 404);
  }
  mediaFailure = false;
  assert.equal((await invoke(deleteCourse)).statusCode, 500);
  assert.equal(exists, true);
  assert.deepEqual(deletedVideos, [lectureId, secondId]);
  databaseFailure = false;
  assert.equal((await invoke(deleteCourse)).statusCode, 200);
  assert.equal(exists, false);
  assert.deepEqual((await invoke(getPendingCourseDeletions)).body.courses, []);
  assert.deepEqual(deletedVideos, [lectureId, secondId]);
});
