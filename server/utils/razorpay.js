import Razorpay from "razorpay";

let instance;
let instanceKey;

export function getRazorpayMode() {
  const mode = (process.env.RAZORPAY_MODE || "test").trim().toLowerCase();
  if (mode !== "test" && mode !== "live") {
    throw new Error("RAZORPAY_MODE must be test or live");
  }
  return mode;
}

export function getRazorpayCredentials() {
  const mode = getRazorpayMode();
  const key = process.env.Razorpay_Key;
  const secret = process.env.Razorpay_Secret;

  if (!key || !secret) {
    throw new Error(`Razorpay ${mode} credentials are not configured`);
  }

  const prefix = mode === "live" ? "rzp_live_" : "rzp_test_";
  if (!key.startsWith(prefix)) {
    throw new Error(`Razorpay ${mode} mode requires a ${prefix} key ID`);
  }

  return { mode, key, secret };
}

export const razorpay = {
  getInstance() {
    const { key, secret } = getRazorpayCredentials();
    if (!instance || instanceKey !== key) {
      instance = new Razorpay({
        key_id: key,
        key_secret: secret,
      });
      instanceKey = key;
    }
    return instance;
  },
};
