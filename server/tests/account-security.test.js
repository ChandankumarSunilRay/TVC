import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import {
  forgotPassword,
  loginUser,
  myProfile,
  register,
  resetPassword,
  verifyUser,
} from "../controllers/user.js";
import { PendingRegistration } from "../models/PendingRegistration.js";
import { User } from "../models/User.js";

async function request(handler, body, extra = {}) {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = JSON.parse(JSON.stringify(value));
    },
  };
  await handler({ body, query: {}, ...extra }, response);
  return response;
}

function captureMail(t) {
  const messages = [];
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (message) => messages.push(message),
  }));
  return messages;
}

test("registration hides credentials, replaces old codes, limits guesses and consumes a valid code once", async (t) => {
  const mail = captureMail(t);
  let pending;
  const created = [];
  t.mock.method(User, "exists", async () => null);
  t.mock.method(User, "create", async (user) => created.push(user));
  t.mock.method(
    PendingRegistration,
    "updateOne",
    async (filter, update, options) => {
      assert.equal(options.upsert, true);
      pending = { ...filter, ...update.$set };
    },
  );
  t.mock.method(
    PendingRegistration,
    "findOneAndUpdate",
    async (filter, update) => {
      if (
        !pending ||
        pending.tokenHash !== filter.tokenHash ||
        !(pending.expiresAt > filter.expiresAt.$gt) ||
        !(pending.attemptsRemaining > filter.attemptsRemaining.$gt)
      )
        return null;
      pending.attemptsRemaining += update.$inc.attemptsRemaining;
      return { _id: pending._id, otpHash: pending.otpHash };
    },
  );
  t.mock.method(PendingRegistration, "findOneAndDelete", async (filter) => {
    if (
      !pending ||
      pending._id !== filter._id ||
      pending.tokenHash !== filter.tokenHash ||
      !(pending.expiresAt > filter.expiresAt.$gt)
    )
      return null;
    const result = pending;
    pending = null;
    return result;
  });
  const credentials = {
    email: "student@example.invalid",
    name: "Student <a>",
    password: "example password",
  };
  const signup = async () => {
    const response = await request(register, credentials);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(Object.keys(response.body).sort(), [
      "activationToken",
      "message",
    ]);
    const token = response.body.activationToken;
    const email = mail.at(-1);
    const otp = email.html.match(/class="otp">(\d{6})</)[1];
    assert.deepEqual(email.to, { address: credentials.email });
    assert.ok(email.html.includes("Student &lt;a&gt;"));
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal(
      pending.tokenHash,
      createHash("sha256").update(token).digest("hex"),
    );
    assert.notEqual(pending.otpHash, otp);
    assert.ok(await bcrypt.compare(credentials.password, pending.passwordHash));
    assert.ok(pending.expiresAt > new Date());
    assert.ok(pending.expiresAt <= Date.now() + 5 * 60_000);
    return { activationToken: token, otp };
  };
  const old = await signup();
  const current = await signup();
  assert.equal((await request(verifyUser, old)).statusCode, 400);
  assert.equal(pending.attemptsRemaining, 5);
  const wrong = {
    ...current,
    otp: current.otp === "123456" ? "654321" : "123456",
  };
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      assert.equal((await request(verifyUser, wrong)).statusCode, 400);
    }),
  );
  assert.equal(pending.attemptsRemaining, 0);
  assert.equal((await request(verifyUser, current)).statusCode, 400);
  const expired = await signup();
  pending.expiresAt = new Date(0);
  assert.equal((await request(verifyUser, expired)).statusCode, 400);
  assert.equal(created.length, 0);

  const valid = await signup();
  const attempts = await Promise.all([
    request(verifyUser, valid),
    request(verifyUser, { ...valid, otp: Number(valid.otp) }),
  ]);
  assert.deepEqual(attempts.map((res) => res.statusCode).sort(), [200, 400]);
  assert.equal(created.length, 1);
  assert.equal(created[0].email, credentials.email);
  assert.ok(await bcrypt.compare(credentials.password, created[0].password));
  assert.equal((await request(verifyUser, valid)).statusCode, 400);
});

test("reset links rotate, expire and change a password at most once, including on legacy accounts", async (t) => {
  const mail = captureMail(t);
  const account = {
    _id: "legacy-student",
    email: "LegacyStudent@example.invalid",
  };
  t.mock.method(User, "findOneAndUpdate", async (filter, update) => {
    if (filter.email !== account.email) return null;
    Object.assign(account, update.$set);
    return { _id: account._id, email: account.email };
  });
  const matches = (filter) =>
    account.resetTokenHash === filter.resetTokenHash &&
    account.resetPasswordExpire > filter.resetPasswordExpire.$gt;
  t.mock.method(User, "exists", async (filter) =>
    matches(filter) ? { _id: account._id } : null,
  );
  t.mock.method(User, "updateOne", async (filter, update) => {
    if (filter._id !== account._id || !matches(filter))
      return { modifiedCount: 0 };
    Object.assign(account, update.$set);
    for (const key of Object.keys(update.$unset)) delete account[key];
    return { modifiedCount: 1 };
  });
  const unknown = await request(forgotPassword, {
    email: "missing@example.invalid",
  });
  assert.equal(unknown.statusCode, 200);
  assert.equal(mail.length, 0);
  const issue = async () => {
    const response = await request(forgotPassword, { email: account.email });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, unknown.body);
    const token = mail
      .at(-1)
      .html.match(/\/reset-password\/([0-9a-f]{64})"/)[1];
    assert.ok(
      mail.at(-1).html.includes(
        `href="https://thevirtualcampus.me/reset-password/${token}"`,
      ),
    );
    assert.equal(
      mail.at(-1).subject,
      "Reset your password | The Virtual Campus",
    );
    assert.ok(mail.at(-1).text.includes("expires in 5 minutes"));
    assert.equal(
      account.resetTokenHash,
      createHash("sha256").update(token).digest("hex"),
    );
    assert.ok(account.resetPasswordExpire <= Date.now() + 5 * 60_000);
    return token;
  };
  const reset = (token) =>
    request(resetPassword, { token, password: "updated password" });
  assert.equal((await reset("a".repeat(64))).statusCode, 400);
  const previous = await issue();
  const expired = await issue();
  assert.notEqual(previous, expired);
  assert.equal((await reset(previous)).statusCode, 400);
  account.resetPasswordExpire = new Date(0);
  assert.equal((await reset(expired)).statusCode, 400);
  const valid = await issue();
  const responses = await Promise.all([
    reset(valid),
    request(
      resetPassword,
      { password: "updated password" },
      { query: { token: valid } },
    ),
  ]);
  assert.deepEqual(responses.map((res) => res.statusCode).sort(), [200, 400]);
  assert.ok(await bcrypt.compare("updated password", account.password));
  assert.equal(account.resetTokenHash, undefined);
  assert.equal(account.resetPasswordExpire, undefined);
  assert.equal((await reset(valid)).statusCode, 400);
});

test("login and profile keep existing session fields and exclude password and reset material", async (t) => {
  const originalSecret = process.env.Jwt_Sec;
  process.env.Jwt_Sec = "local-test-session-key";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.Jwt_Sec;
    else process.env.Jwt_Sec = originalSecret;
  });
  const user = new User({
    name: "Student",
    email: "LegacyStudent@example.invalid",
    password: await bcrypt.hash("legacy password", 4),
    resetTokenHash: "example-digest",
    resetPasswordExpire: new Date(),
    role: "admin",
  });
  t.mock.method(User, "findOne", (filter) => ({
    select: async (fields) => {
      assert.equal(filter.email, user.email);
      assert.equal(fields, "+password");
      return user;
    },
  }));
  const login = await request(loginUser, {
    email: user.email,
    password: "legacy password",
  });
  assert.equal(login.statusCode, 200);
  assert.equal(
    jwt.verify(login.body.token, process.env.Jwt_Sec)._id,
    String(user._id),
  );
  const profile = await request(myProfile, {}, { user });
  assert.deepEqual(login.body.user, profile.body.user);
  assert.equal(profile.body.user.role, "admin");
  assert.deepEqual(profile.body.user.subscription, []);
  for (const key of ["password", "resetTokenHash", "resetPasswordExpire"]) {
    assert.equal(Object.hasOwn(profile.body.user, key), false);
    assert.equal(User.schema.path(key).options.select, false);
  }
});
