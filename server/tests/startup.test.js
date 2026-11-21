import assert from "node:assert/strict";
import test from "node:test";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

function configureTest(t) {
  t.mock.method(dotenv, "config", () => ({}));
  const previousDb = process.env.DB;
  const previousMode = process.env.RAZORPAY_MODE;
  const previousKey = process.env.Razorpay_Key;
  const previousSecret = process.env.Razorpay_Secret;
  process.env.DB = "test-connection";
  process.env.RAZORPAY_MODE = "test";
  process.env.Razorpay_Key = "rzp_test_test_key";
  process.env.Razorpay_Secret = "test-payment-secret";
  t.after(() => {
    if (previousDb === undefined) delete process.env.DB;
    else process.env.DB = previousDb;
    if (previousMode === undefined) delete process.env.RAZORPAY_MODE;
    else process.env.RAZORPAY_MODE = previousMode;
    if (previousKey === undefined) delete process.env.Razorpay_Key;
    else process.env.Razorpay_Key = previousKey;
    if (previousSecret === undefined) delete process.env.Razorpay_Secret;
    else process.env.Razorpay_Secret = previousSecret;
  });
}

test("failed database startup exits unsuccessfully before opening the port", async (t) => {
  configureTest(t);
  const previousExitCode = process.exitCode;
  t.after(() => {
    process.exitCode = previousExitCode;
  });
  const message = t.mock.method(console, "error", () => {});
  const listen = t.mock.method(express.application, "listen", () => {});
  t.mock.method(mongoose, "connect", async () => {
    throw new Error("private driver detail");
  });
  await import("../index.js?failed-startup");
  assert.equal(process.exitCode, 1);
  assert.equal(listen.mock.callCount(), 0);
  assert.doesNotMatch(
    JSON.stringify(message.mock.calls[0].arguments),
    /private driver detail/,
  );
});

test("readiness follows the initial connection and a later disconnection", async (t) => {
  configureTest(t);
  const order = [];
  t.mock.method(mongoose, "connect", async () => {
    order.push("connected");
  });
  let app;
  t.mock.method(express.application, "listen", function () {
    order.push("listening");
    app = this;
  });
  await import("../index.js?successful-startup");
  assert.deepEqual(order, ["connected", "listening"]);
  const health = app._router.stack.find(
    (layer) => layer.route?.path === "/",
  ).route;
  const response = {
    set() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    send() {},
  };
  for (const [state, status] of [
    [1, 200],
    [0, 503],
  ]) {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: state,
    });
    try {
      response.statusCode = 200;
      health.dispatch({ method: "GET" }, response, assert.fail);
      assert.equal(response.statusCode, status);
    } finally {
      delete mongoose.connection.readyState;
    }
  }
});
