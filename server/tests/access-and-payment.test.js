import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import jwt from "jsonwebtoken";
import courseRoutes from "../routes/course.js";
import adminRoutes from "../routes/admin.js";
import { publicCourseImages } from "../middlewares/publicCourseImages.js";
import { User } from "../models/User.js";
import { Lecture } from "../models/Lecture.js";
import { Courses } from "../models/Courses.js";
import { CourseOrder } from "../models/CourseOrder.js";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";
import { imageStorage, videoStorage } from "../utils/videoStorage.js";
import { razorpay } from "../utils/razorpay.js";

process.env.Jwt_Sec = "test-jwt-secret";
process.env.RAZORPAY_MODE = "test";
process.env.Razorpay_Key = "rzp_test_test_key";
process.env.Razorpay_Secret = "test-payment-secret";
const courseId = "aaaaaaaaaaaaaaaaaaaaaaaa";
const otherCourseId = "bbbbbbbbbbbbbbbbbbbbbbbb";
const buyerId = "cccccccccccccccccccccccc";
const otherUserId = "dddddddddddddddddddddddd";
const adminId = "eeeeeeeeeeeeeeeeeeeeeeee";
const lectureId = "ffffffffffffffffffffffff";

const users = {
  [buyerId]: { _id: buyerId, role: "user", subscription: [courseId] },
  [otherUserId]: { _id: otherUserId, role: "user", subscription: [] },
  [adminId]: { _id: adminId, role: "admin", subscription: [] },
};

async function startApp(t, staticDir) {
  const app = express();
  app.use(express.json());
  app.use("/api", courseRoutes);
  app.use("/api", adminRoutes);
  if (staticDir) {
    app.use(
      "/uploads",
      publicCourseImages,
      express.static(staticDir, { index: false }),
    );
  }
  const listener = await new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  t.after(
    () =>
      new Promise((resolve, reject) =>
        listener.close((err) => (err ? reject(err) : resolve())),
      ),
  );
  return `http://127.0.0.1:${listener.address().port}`;
}

function token(userId) {
  return jwt.sign({ _id: userId }, process.env.Jwt_Sec);
}

function auth(userId) {
  return { token: token(userId) };
}

test("lecture URLs require login and the right course; admins can preview", async (t) => {
  t.mock.method(Courses, "exists", async () => ({ _id: courseId }));
  t.mock.method(User, "findById", async (id) => users[id] || null);
  t.mock.method(Lecture, "findById", async () => ({
    _id: lectureId,
    course: courseId,
    title: "Lesson 1",
    description: "Description",
    video: "lectures/private/key.mp4",
    videoStorage: "s3",
  }));
  let signed = 0;
  t.mock.method(videoStorage, "getWatchUrl", async () => {
    signed++;
    return "https://example.invalid/temporary-link";
  });
  const base = await startApp(t);
  const endpoint = `${base}/api/lecture/${lectureId}`;

  assert.equal((await fetch(endpoint)).status, 401);
  assert.equal(
    (await fetch(endpoint, { headers: { token: "invalid" } })).status,
    401,
  );
  assert.equal(
    (await fetch(endpoint, { headers: auth(otherUserId) })).status,
    403,
  );
  assert.equal(signed, 0, "no URL is signed for an unauthorized user");

  const buyerResponse = await fetch(endpoint, { headers: auth(buyerId) });
  assert.equal(buyerResponse.status, 200);
  assert.match(buyerResponse.headers.get("cache-control"), /no-store/);
  const body = await buyerResponse.json();
  assert.equal(body.lecture.videoUrl, "https://example.invalid/temporary-link");
  assert.equal(body.lecture.expiresIn, 900);
  assert.equal(
    body.lecture.video,
    undefined,
    "private S3 key is not in the response",
  );

  assert.equal((await fetch(endpoint, { headers: auth(adminId) })).status, 200);
  assert.equal(signed, 2);
});

test("legacy files cannot be reached through the public uploads URL", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lms-static-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "old-video.mp4"), "private video");
  await writeFile(path.join(dir, "course-image.jpg"), "public image");
  t.mock.method(Courses, "exists", async (query) =>
    query.image.$in.includes("uploads/course-image.jpg")
      ? { _id: courseId }
      : null,
  );
  const base = await startApp(t, dir);
  assert.equal((await fetch(`${base}/uploads/old-video.mp4`)).status, 404);
  const image = await fetch(`${base}/uploads/course-image.jpg`);
  assert.equal(image.status, 200);
  assert.equal(await image.text(), "public image");
});

test("only administrators can list courses awaiting deletion", async (t) => {
  t.mock.method(User, "findById", async (id) => users[id] || null);
  const pending = [{ _id: courseId, title: "Algorithms" }];
  t.mock.method(Courses, "find", (query) => {
    assert.deepEqual(query, { deletionPending: true });
    return {
      select: async (projection) => {
        assert.equal(projection, "_id title");
        return pending;
      },
    };
  });
  const base = await startApp(t);
  const url = `${base}/api/admin/pending-course-deletions`;
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: auth(buyerId) })).status, 403);
  const response = await fetch(url, { headers: auth(adminId) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { courses: pending });
});

test("only admins upload videos and temporary files are removed", async (t) => {
  t.mock.method(User, "findById", async (id) => users[id] || null);
  t.mock.method(Courses, "findOne", async () => ({ _id: courseId }));
  t.mock.method(Courses, "exists", async () => ({ _id: courseId }));
  let tempPath;
  t.mock.method(videoStorage, "upload", async (options) => {
    tempPath = options.filePath;
    assert.ok(!tempPath.includes(`${path.sep}uploads${path.sep}`));
    assert.equal(readFileSync(tempPath, "utf8"), "fake video");
    assert.equal(options.contentType, "video/mp4");
    return "lectures/course/key.mp4";
  });
  t.mock.method(Lecture, "create", async (value) => ({
    ...value,
    _id: lectureId,
  }));
  const base = await startApp(t);
  const form = () => {
    const data = new FormData();
    data.append("title", "Lesson");
    data.append("description", "Description");
    data.append(
      "file",
      new Blob(["fake video"], { type: "video/mp4" }),
      "lesson.mp4",
    );
    return data;
  };
  assert.equal(
    (
      await fetch(`${base}/api/course/${courseId}`, {
        method: "POST",
        headers: auth(otherUserId),
        body: form(),
      })
    ).status,
    403,
  );
  const response = await fetch(`${base}/api/course/${courseId}`, {
    method: "POST",
    headers: auth(adminId),
    body: form(),
  });
  assert.equal(response.status, 201);
  assert.equal(
    existsSync(tempPath),
    false,
    "temporary video is deleted after upload",
  );
  const body = await response.json();
  assert.equal(body.lecture.video, undefined);
});

test("course images are uploaded privately to S3 and temporary files are removed", async (t) => {
  t.mock.method(User, "findById", async (id) => users[id] || null);
  let tempPath;
  t.mock.method(imageStorage, "upload", async (options) => {
    tempPath = options.filePath;
    assert.equal(readFileSync(tempPath, "utf8"), "fake image");
    assert.equal(options.contentType, "image/png");
    return "course-images/private-image.png";
  });
  let saved;
  t.mock.method(Courses, "create", async (value) => {
    saved = value;
    return { ...value, _id: courseId };
  });
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: "Course",
    description: "Description",
    category: "Web Development",
    createdBy: "Teacher",
    duration: "4",
    price: "499",
  }))
    data.append(key, value);
  data.append(
    "file",
    new Blob(["fake image"], { type: "image/png" }),
    "thumbnail.png",
  );

  const base = await startApp(t);
  const response = await fetch(`${base}/api/course/new`, {
    method: "POST",
    headers: auth(adminId),
    body: data,
  });
  assert.equal(response.status, 201);
  assert.equal(saved.image, "course-images/private-image.png");
  assert.equal(saved.imageStorage, "s3");
  assert.equal(
    existsSync(tempPath),
    false,
    "temporary image is deleted after upload",
  );
});

test("payment must belong to the buyer and course and be captured for the stored amount", async (t) => {
  let courseAvailable = true;
  t.mock.method(Courses, "exists", async (filter) => {
    assert.deepEqual(filter, { _id: courseId, deletionPending: { $ne: true } });
    return courseAvailable ? { _id: courseId } : null;
  });
  t.mock.method(User, "findById", async (id) => users[id] || null);
  const order = {
    _id: "order-record",
    orderId: "order_test",
    user: buyerId,
    course: courseId,
    amount: 49900,
    currency: "INR",
    status: "created",
  };
  t.mock.method(CourseOrder, "findOne", async (query) =>
    query.orderId === order.orderId &&
    query.user === order.user &&
    query.course === order.course
      ? order
      : null,
  );
  t.mock.method(CourseOrder, "findOneAndUpdate", async (filter, update) => {
    if (order.status === "paid" && order.paymentId !== update.$set.paymentId)
      return null;
    Object.assign(order, update.$set);
    return order;
  });
  let payment = {
    id: "pay_test",
    order_id: "order_test",
    status: "authorized",
    amount: 49900,
    currency: "INR",
    amount_refunded: 0,
  };
  t.mock.method(razorpay, "getInstance", () => ({
    payments: { fetch: async () => payment },
  }));
  let grants = 0;
  t.mock.method(Progress, "updateOne", async () => ({}));
  t.mock.method(Payment, "updateOne", async () => ({}));
  t.mock.method(User, "updateOne", async (_filter, update) => {
    assert.equal(update.$addToSet.subscription, courseId);
    grants++;
    return {};
  });

  const signature = createHmac("sha256", process.env.Razorpay_Secret)
    .update("order_test|pay_test")
    .digest("hex");
  const body = JSON.stringify({
    razorpay_order_id: "order_test",
    razorpay_payment_id: "pay_test",
    razorpay_signature: signature,
  });
  const base = await startApp(t);
  const verify = (course, user) =>
    fetch(`${base}/api/verification/${course}`, {
      method: "POST",
      headers: { ...auth(user), "content-type": "application/json" },
      body,
    });

  assert.equal((await verify(otherCourseId, buyerId)).status, 403);
  assert.equal((await verify(courseId, otherUserId)).status, 403);
  const invalidSignature = await fetch(`${base}/api/verification/${courseId}`, {
    method: "POST",
    headers: { ...auth(buyerId), "content-type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: "order_test",
      razorpay_payment_id: "pay_test",
      razorpay_signature: "0".repeat(64),
    }),
  });
  assert.equal(invalidSignature.status, 400);
  assert.equal(
    (await verify(courseId, buyerId)).status,
    409,
    "authorized is not captured",
  );
  payment = { ...payment, status: "captured", amount: 1 };
  assert.equal((await verify(courseId, buyerId)).status, 409, "wrong amount");
  payment = { ...payment, amount: 49900, order_id: "order_other" };
  assert.equal((await verify(courseId, buyerId)).status, 409, "wrong order");
  payment = { ...payment, order_id: "order_test", amount_refunded: 1 };
  assert.equal(
    (await verify(courseId, buyerId)).status,
    409,
    "refunded payment",
  );
  assert.equal(grants, 0);

  payment = { ...payment, amount_refunded: 0 };
  assert.equal((await verify(courseId, buyerId)).status, 200);
  assert.equal(order.status, "paid");
  assert.equal(order.paymentId, "pay_test");
  assert.equal(grants, 1);
  assert.equal(
    (await verify(courseId, buyerId)).status,
    200,
    "same payment can be retried",
  );
  assert.equal(grants, 2, "the retry uses an idempotent $addToSet");
  courseAvailable = false;
  assert.equal((await verify(courseId, buyerId)).status, 409);
  assert.equal(grants, 2);
});

test("the buyer can recover a captured payment after an interrupted callback", async (t) => {
  t.mock.method(Courses, "exists", async () => ({ _id: courseId }));
  t.mock.method(User, "findById", async (id) => users[id] || null);
  const order = {
    _id: "recovery-record",
    orderId: "order_recovery",
    user: buyerId,
    course: courseId,
    amount: 49900,
    currency: "INR",
    status: "created",
  };
  t.mock.method(CourseOrder, "find", (query) => ({
    sort: () => ({
      limit: async () =>
        query.user === buyerId && query.course === courseId ? [order] : [],
    }),
  }));
  t.mock.method(CourseOrder, "findOneAndUpdate", async (_filter, update) => {
    Object.assign(order, update.$set);
    return order;
  });
  t.mock.method(razorpay, "getInstance", () => ({
    orders: {
      fetchPayments: async () => ({
        items: [
          {
            id: "pay_recovery",
            order_id: "order_recovery",
            status: "captured",
            amount: 49900,
            currency: "INR",
            amount_refunded: 0,
          },
        ],
      }),
    },
  }));
  t.mock.method(Progress, "updateOne", async () => ({}));
  t.mock.method(Payment, "updateOne", async () => ({}));
  let granted = 0;
  t.mock.method(User, "updateOne", async () => {
    granted++;
    return {};
  });
  const base = await startApp(t);
  const check = (user) =>
    fetch(`${base}/api/course/reconcile/${courseId}`, {
      method: "POST",
      headers: auth(user),
    });

  assert.equal((await check(otherUserId)).status, 404);
  assert.equal(granted, 0);
  const response = await check(buyerId);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).paymentId, "pay_recovery");
  assert.equal(granted, 1);
});

test("S3 viewing links expire after 15 minutes", async (t) => {
  t.mock.method(process, "emitWarning", () => {});
  process.env.AWS_REGION = "ap-south-1";
  process.env.AWS_S3_BUCKET = "test-private-bucket";
  process.env.AWS_ACCESS_KEY_ID = "example-access-key";
  process.env.AWS_SECRET_ACCESS_KEY = "example-secret-key";
  const url = new URL(
    await videoStorage.getWatchUrl("lectures/course/lesson.mp4"),
  );
  assert.equal(url.searchParams.get("X-Amz-Expires"), "900");
  assert.match(url.pathname, /lectures\/course\/lesson\.mp4$/);
});
