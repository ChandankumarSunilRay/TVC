import mongoose from "mongoose";

export async function connectDb() {
  if (!process.env.DB) throw new Error("Missing DB configuration");
  await mongoose.connect(process.env.DB);
  console.log(
    `MongoDB connected successfully. Database: ${mongoose.connection.name || "configured database"}`,
  );
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}
