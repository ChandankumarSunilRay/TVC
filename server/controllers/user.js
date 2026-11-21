import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { PendingRegistration } from "../models/PendingRegistration.js";
import TryCatch from "../middlewares/TryCatch.js";
import sendMail, { sendForgotMail } from "../middlewares/sendMail.js";

const challengeLifetime = 5 * 60 * 1000;
const maxOtpAttempts = 5;
const invalidCode =
  "The verification code is incorrect or expired. You can register again for a new code.";
const invalidResetLink =
  "This reset link is invalid or expired. Request a new link.";

function isEmail(value) {
  return typeof value === "string" && /^[^\s@,;<>]+@[^\s@,;<>]+$/.test(value);
}

function isToken(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function otpHash(token, otp) {
  return createHmac("sha256", token).update(otp).digest();
}

export const register = TryCatch(async (req, res) => {
  const { email, name, password } = req.body;
  if (
    !isEmail(email) ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res
      .status(400)
      .json({ message: "Enter a name, email address and password." });
  }
  if (await User.exists({ email })) {
    return res.status(400).json({ message: "User already exists" });
  }

  const activationToken = randomBytes(32).toString("hex");
  const otp = String(randomInt(100000, 1000000));
  const passwordHash = await bcrypt.hash(password, 10);
  const digest = tokenHash(activationToken);
  await PendingRegistration.updateOne(
    { _id: email },
    {
      $set: {
        name: name.trim(),
        passwordHash,
        tokenHash: digest,
        otpHash: otpHash(activationToken, otp).toString("hex"),
        expiresAt: new Date(Date.now() + challengeLifetime),
        attemptsRemaining: maxOtpAttempts,
      },
    },
    { upsert: true },
  );
  try {
    await sendMail(email, "The Virtual Campus", { name: name.trim(), otp });
  } catch (error) {
    await PendingRegistration.deleteOne({ _id: email, tokenHash: digest });
    throw error;
  }
  res.json({
    message: "A verification code has been sent to your email.",
    activationToken,
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { otp, activationToken } = req.body;
  if (
    !isToken(activationToken) ||
    (typeof otp !== "number" && typeof otp !== "string") ||
    !/^\d{6}$/.test(String(otp))
  ) {
    return res.status(400).json({ message: invalidCode });
  }

  const digest = tokenHash(activationToken);
  const challenge = await PendingRegistration.findOneAndUpdate(
    {
      tokenHash: digest,
      expiresAt: { $gt: new Date() },
      attemptsRemaining: { $gt: 0 },
    },
    { $inc: { attemptsRemaining: -1 } },
    { projection: { otpHash: 1 } },
  );
  if (
    !challenge ||
    !timingSafeEqual(
      Buffer.from(challenge.otpHash, "hex"),
      otpHash(activationToken, String(otp)),
    )
  ) {
    return res.status(400).json({ message: invalidCode });
  }
  const registration = await PendingRegistration.findOneAndDelete({
    _id: challenge._id,
    tokenHash: digest,
    expiresAt: { $gt: new Date() },
  });
  if (!registration) return res.status(400).json({ message: invalidCode });
  try {
    await User.create({
      email: registration._id,
      name: registration.name,
      password: registration.passwordHash,
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ message: "User already exists" });
    throw error;
  }
  res.json({ message: "User Registered" });
});

export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Incorrect email or password" });
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Incorrect email or password" });
  }
  const token = jwt.sign({ _id: user._id }, process.env.Jwt_Sec, {
    expiresIn: "15d",
  });
  res.json({ message: `Welcome back ${user.name}`, token, user });
});

export const myProfile = TryCatch(async (req, res) => {
  res.json({ user: req.user });
});

export const updateProfile = TryCatch(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  const bio = typeof req.body.bio === "string" ? req.body.bio.trim() : "";
  const location =
    typeof req.body.location === "string" ? req.body.location.trim() : "";

  if (name.length < 2 || name.length > 60) {
    return res
      .status(400)
      .json({ message: "Name must be between 2 and 60 characters" });
  }
  if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) {
    return res.status(400).json({ message: "Enter a valid phone number" });
  }
  if (bio.length > 240 || location.length > 80) {
    return res.status(400).json({ message: "Profile details are too long" });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, phone, bio, location } },
    { new: true, runValidators: true },
  );
  res.json({ message: "Profile updated", user });
});

export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;
  if (!isEmail(email))
    return res.status(400).json({ message: "Enter an email address." });
  const token = randomBytes(32).toString("hex");
  const digest = tokenHash(token);
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        resetTokenHash: digest,
        resetPasswordExpire: new Date(Date.now() + challengeLifetime),
      },
    },
    { projection: { email: 1 } },
  );
  if (user) {
    try {
      await sendForgotMail("Reset your password | The Virtual Campus", {
        email: user.email,
        token,
      });
    } catch (error) {
      await User.updateOne(
        { _id: user._id, resetTokenHash: digest },
        {
          $unset: { resetTokenHash: 1, resetPasswordExpire: 1 },
        },
      );
      throw error;
    }
  }
  res.json({
    message: "If this account exists, a reset link has been sent to its email.",
  });
});

export const resetPassword = TryCatch(async (req, res) => {
  const { password } = req.body;
  const token = req.body.token ?? req.query.token;
  if (!isToken(token))
    return res.status(400).json({ message: invalidResetLink });
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Enter a new password." });
  }
  const digest = tokenHash(token);
  const user = await User.exists({
    resetTokenHash: digest,
    resetPasswordExpire: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: invalidResetLink });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await User.updateOne(
    {
      _id: user._id,
      resetTokenHash: digest,
      resetPasswordExpire: { $gt: new Date() },
    },
    {
      $set: { password: passwordHash },
      $unset: { resetTokenHash: 1, resetPasswordExpire: 1 },
    },
  );
  if (!result.modifiedCount)
    return res.status(400).json({ message: invalidResetLink });
  res.json({ message: "Password Reset" });
});
