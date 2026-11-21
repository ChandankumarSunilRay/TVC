import crypto from "node:crypto";
import mongoose from "mongoose";
import TryCatch from "../middlewares/TryCatch.js";
import { Courses, availableCourseFilter } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";
import { CourseOrder } from "../models/CourseOrder.js";
import { canWatchCourse } from "../utils/courseAccess.js";
import { getRazorpayCredentials, razorpay } from "../utils/razorpay.js";
import {
  imageStorage,
  videoStorage,
  VIDEO_URL_SECONDS,
} from "../utils/videoStorage.js";

async function addCourseImageUrl(course, req) {
  if (!course) return course;
  const value = course.toObject ? course.toObject() : { ...course };
  value.imageUrl =
    value.imageStorage === "s3"
      ? await imageStorage.getUrl(value.image)
      : `${req.protocol}://${req.get("host")}/${String(value.image).replaceAll("\\", "/")}`;
  delete value.image;
  return value;
}

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find(availableCourseFilter);
  res.set("Cache-Control", "private, no-store");
  res.json({
    courses: await Promise.all(
      courses.map((course) => addCourseImageUrl(course, req)),
    ),
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findOne({
    _id: req.params.id,
    ...availableCourseFilter,
  });
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.set("Cache-Control", "private, no-store");
  res.json({ course: await addCourseImageUrl(course, req) });
});

function courseIsAvailable(courseId) {
  return Courses.exists({ _id: courseId, ...availableCourseFilter });
}

async function requireCourseAccess(user, courseId, res) {
  if (!mongoose.isObjectIdOrHexString(courseId)) {
    res.status(400).json({ message: "Invalid course ID" });
    return false;
  }
  if (!canWatchCourse(user, courseId.toString().toLowerCase())) {
    res.status(403).json({ message: "You have not purchased this course" });
    return false;
  }
  if (!(await courseIsAvailable(courseId))) {
    res.status(404).json({ message: "Course not found" });
    return false;
  }
  return true;
}

export const fetchLectures = TryCatch(async (req, res) => {
  if (!(await requireCourseAccess(req.user, req.params.id, res))) return;

  const lectures = await Lecture.find({ course: req.params.id }).select(
    "_id title description course createdAt",
  );
  res.set("Cache-Control", "private, no-store");
  res.json({ lectures });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });
  if (!(await requireCourseAccess(req.user, lecture.course, res))) return;
  if (lecture.videoStorage !== "s3") {
    return res.status(409).json({
      message:
        "This video needs to be moved to private storage before it can play",
    });
  }

  const videoUrl = await videoStorage.getWatchUrl(lecture.video);
  res.set("Cache-Control", "private, no-store");
  res.json({
    lecture: {
      _id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      course: lecture.course,
      videoUrl,
      expiresIn: VIDEO_URL_SECONDS,
    },
  });
});

export const getMyCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find({
    _id: req.user.subscription,
    ...availableCourseFilter,
  });
  res.set("Cache-Control", "private, no-store");
  res.json({
    courses: await Promise.all(
      courses.map((course) => addCourseImageUrl(course, req)),
    ),
  });
});

export const checkout = TryCatch(async (req, res) => {
  const course = await Courses.findOne({
    _id: req.params.id,
    ...availableCourseFilter,
  });
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (canWatchCourse({ subscription: req.user.subscription }, course._id)) {
    return res.status(400).json({ message: "You already have this course" });
  }

  const amount = Math.round(Number(course.price) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return res
      .status(400)
      .json({ message: "This course has an invalid price" });
  }

  const order = await razorpay
    .getInstance()
    .orders.create({ amount, currency: "INR" });
  if (order.amount !== amount || order.currency !== "INR") {
    throw new Error("The payment order did not match the course price");
  }

  await CourseOrder.create({
    orderId: order.id,
    user: req.user._id,
    course: course._id,
    amount,
    currency: "INR",
  });
  if (!(await courseIsAvailable(course._id))) {
    return res
      .status(409)
      .json({ message: "This course is no longer available for purchase" });
  }
  const { key, mode } = getRazorpayCredentials();
  res.status(201).json({ order, key, mode });
});

function isValidSignature(orderId, paymentId, signature) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature))
    return false;
  const { secret } = getRazorpayCredentials();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function paymentMatchesOrder(payment, order) {
  return (
    Boolean(payment) &&
    payment.order_id === order.orderId &&
    payment.status === "captured" &&
    Number(payment.amount) === order.amount &&
    payment.currency === order.currency &&
    Number(payment.amount_refunded || 0) === 0
  );
}

async function grantCourse(order, payment, signature) {
  if (!(await courseIsAvailable(order.course))) return false;
  const claimed = await CourseOrder.findOneAndUpdate(
    {
      _id: order._id,
      $or: [{ status: "created" }, { status: "paid", paymentId: payment.id }],
    },
    { $set: { status: "paid", paymentId: payment.id } },
    { new: true },
  );
  if (!claimed) throw new Error("This order has already been used");

  await Progress.updateOne(
    { user: order.user, course: order.course },
    {
      $setOnInsert: {
        user: order.user,
        course: order.course,
        completedLectures: [],
      },
    },
    { upsert: true },
  );
  await User.updateOne(
    { _id: order.user },
    { $addToSet: { subscription: order.course } },
  );
  await Payment.updateOne(
    { razorpay_order_id: order.orderId, razorpay_payment_id: payment.id },
    {
      $setOnInsert: {
        razorpay_order_id: order.orderId,
        razorpay_payment_id: payment.id,
        ...(signature ? { razorpay_signature: signature } : {}),
        user: order.user,
        course: order.course,
        amount: order.amount,
        currency: order.currency,
      },
    },
    { upsert: true },
  );
  if (!(await courseIsAvailable(order.course))) {
    await User.updateOne(
      { _id: order.user },
      { $pull: { subscription: order.course } },
    );
    await Progress.deleteMany({ user: order.user, course: order.course });
    return false;
  }
  return true;
}

export const paymentVerification = TryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string"
  ) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  const order = await CourseOrder.findOne({
    orderId: razorpay_order_id,
    user: req.user._id,
    course: req.params.id,
  });
  if (!order)
    return res
      .status(403)
      .json({ message: "Payment does not belong to this course" });
  if (
    !isValidSignature(order.orderId, razorpay_payment_id, razorpay_signature)
  ) {
    return res.status(400).json({ message: "Payment signature is invalid" });
  }

  const payment = await razorpay
    .getInstance()
    .payments.fetch(razorpay_payment_id);
  if (!paymentMatchesOrder(payment, order)) {
    return res.status(409).json({
      message:
        "Payment is not captured yet. Use Check previous payment to try again.",
    });
  }
  if (!(await grantCourse(order, payment, razorpay_signature))) {
    return res
      .status(409)
      .json({
        message:
          "Payment was captured for a removed course. Contact support with your payment ID.",
      });
  }
  res.status(200).json({ message: "Course Purchased Successfully" });
});

export const reconcilePayment = TryCatch(async (req, res) => {
  const orders = await CourseOrder.find({
    user: req.user._id,
    course: req.params.id,
  })
    .sort({ createdAt: -1 })
    .limit(25);
  const gateway = razorpay.getInstance();

  for (const order of orders) {
    const payments = order.paymentId
      ? [await gateway.payments.fetch(order.paymentId)]
      : (await gateway.orders.fetchPayments(order.orderId)).items;
    const payment = payments.find((item) => paymentMatchesOrder(item, order));
    if (payment) {
      if (!(await grantCourse(order, payment))) {
        return res
          .status(409)
          .json({
            message:
              "Payment was captured for a removed course. Contact support with your payment ID.",
            paymentId: payment.id,
          });
      }
      return res.json({
        message: "Course Purchased Successfully",
        paymentId: payment.id,
      });
    }
  }
  res
    .status(404)
    .json({ message: "No captured payment found for this course yet" });
});

export const addProgress = TryCatch(async (req, res) => {
  const { course, lectureId } = req.query;
  if (!(await requireCourseAccess(req.user, course, res))) return;
  if (!mongoose.isObjectIdOrHexString(lectureId)) {
    return res.status(400).json({ message: "Invalid lecture ID" });
  }
  if (!(await Lecture.exists({ _id: lectureId, course }))) {
    return res
      .status(404)
      .json({ message: "Lecture not found in this course" });
  }
  const previous = await Progress.findOneAndUpdate(
    { user: req.user._id, course },
    { $addToSet: { completedLectures: lectureId } },
    { new: false },
  );
  if (!previous) return res.status(404).json({ message: "Progress not found" });
  if (
    previous.completedLectures.some(
      (id) => String(id) === lectureId.toLowerCase(),
    )
  ) {
    return res.json({ message: "Progress recorded" });
  }
  res.status(201).json({ message: "new Progress added" });
});

export const getYourProgress = TryCatch(async (req, res) => {
  const { course } = req.query;
  if (!(await requireCourseAccess(req.user, course, res))) return;
  const [records, lectures] = await Promise.all([
    Progress.find({ user: req.user._id, course }).lean(),
    Lecture.find({ course }).select("_id").lean(),
  ]);
  if (!records.length)
    return res.status(404).json({ message: "Progress not found" });

  const recorded = new Set(
    records.flatMap((record) => (record.completedLectures || []).map(String)),
  );
  const currentCompletions = lectures
    .map((lecture) => String(lecture._id))
    .filter((id) => recorded.has(id));
  const progress = [{ ...records[0], completedLectures: currentCompletions }];
  const allLectures = lectures.length;
  const completedLectures = currentCompletions.length;
  const courseProgressPercentage = allLectures
    ? (completedLectures * 100) / allLectures
    : 0;

  res.json({
    courseProgressPercentage,
    completedLectures,
    allLectures,
    progress,
  });
});
