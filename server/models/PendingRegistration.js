import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String, required: true }, // Email address, so a new code replaces the previous one.
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true },
  otpHash: { type: String, required: true },
  attemptsRemaining: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const PendingRegistration = mongoose.model(
  "PendingRegistration",
  schema,
);
