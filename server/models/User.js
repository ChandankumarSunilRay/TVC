import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      default: "",
      maxlength: 20,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 240,
    },
    location: {
      type: String,
      default: "",
      maxlength: 80,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: "user",
    },
    mainrole: {
      type: String,
      default: "user",
    },
    subscription: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
      },
    ],
    resetTokenHash: { type: String, select: false, index: { sparse: true } },
    resetPasswordExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, user) {
        delete user.password;
        delete user.resetTokenHash;
        delete user.resetPasswordExpire;
        return user;
      },
    },
  },
);

export const User = mongoose.model("User", schema);
