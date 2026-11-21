import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
      required: true,
    },
    amount: {
      type: Number,
      required: true, // paise
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "paid"],
      default: "created",
    },
    paymentId: String,
  },
  { timestamps: true },
);

export const CourseOrder = mongoose.model("CourseOrder", schema);
