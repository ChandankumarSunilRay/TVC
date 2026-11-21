# Razorpay Live Test Setup


Use this checklist before accepting real Razorpay payments. Keep the application in test mode until every item below is complete.

## 1. Complete Razorpay activation

1. Sign in to the Razorpay Dashboard.
2. Activate the account and complete all required business verification.
3. Open **Settings > API Keys**.
4. Generate live API keys.
5. Keep the live key secret private.

## 2. Configure the server

Set these values in the server deployment environment or `server/.env`:

```env
RAZORPAY_MODE=live
Razorpay_Key=rzp_live_your_key_id
Razorpay_Secret=your_live_key_secret
```

Rules:

- The key ID must start with `rzp_live_`.
- The key secret must be from the live-key pair.
- Never add `Razorpay_Secret` to React or frontend environment files.
- Never commit `server/.env`.
- Restart the server after changing environment variables.

The server validates the mode and key prefix during startup.

## 3. Deploy securely

1. Deploy the backend and frontend over HTTPS.
2. Set `VITE_API_BASE_URL` to the HTTPS backend URL.
3. Set `frontendurl` to the public HTTPS frontend URL.
4. Confirm MongoDB, AWS S3, email, and Razorpay secrets are configured only on the server or deployment platform.
5. Confirm CORS allows the production frontend origin.

## 4. Back up before testing

Before live checkout:

- Back up MongoDB.
- Review existing user subscriptions.
- Export or record pending `CourseOrder` records.
- Confirm the S3 video bucket and course-image bucket are correct.
- Verify administrators can manage courses and lectures.

Existing subscriptions and pending orders created before the current payment implementation should be reviewed manually.

## 5. Perform a minimum real payment test

Use a low-priced course and a personal Razorpay-supported payment method.

1. Start in a fresh browser session.
2. Set `RAZORPAY_MODE=live`.
3. Start the server and confirm it starts successfully.
4. Log in as a test buyer account.
5. Open the course purchase page.
6. Click **Buy Now**.
7. Confirm the Razorpay checkout shows the live checkout mode.
8. Complete the minimum real payment.
9. Confirm the course appears in the buyer dashboard.
10. Confirm the server created the payment record.
11. Open a lecture and confirm the signed S3 video plays.
12. Confirm course progress can be added.

## 6. Test interrupted payment recovery

Use a real captured payment but stop or refresh the browser before the verification callback completes.

1. Complete payment in Razorpay.
2. Prevent or interrupt the verification callback.
3. Return to the course purchase page.
4. Click **Check previous payment**.
5. Confirm the captured payment grants access once.

Do not test with a duplicate course purchase as a normal verification; the server should reject an already owned course.

## 7. Test refund and access handling

Create one real refundable payment.

1. Confirm access is granted.
2. Refund the payment from the Razorpay Dashboard.
3. Record the result.
4. Review whether access is automatically revoked.

The current backend does not automatically reconcile every refund and revoke course access. Until that behavior is implemented, remove access manually after confirmed refunds.

## 8. Test failure cases

Confirm the application behaves correctly when:

- Payment is cancelled.
- Payment fails.
- Signature verification fails.
- Razorpay credentials are missing.
- `RAZORPAY_MODE` and key prefix do not match.
- The course is deleted during checkout.
- The course is deleted during payment verification.
- The callback is interrupted and reconciliation is required.
- The browser refreshes on the payment success page.

## 9. Rollback

If a live test fails:

1. Stop new live checkouts.
2. Set `RAZORPAY_MODE=test`.
3. Restore test API credentials.
4. Restart the server.
5. Restore or correct MongoDB records if required.
6. Refund verified live test payments.
7. Remove any test subscriptions granted during the check.
8. Review Razorpay orders and payment IDs before restoring live mode.

## 10. Production sign-off

Live payments should only remain enabled after confirming:

- HTTPS is active.
- Live Razorpay key and secret match.
- Server startup succeeds.
- Course price is correctly stored in paise.
- Payment signature verification passes.
- Captured payments grant access exactly once.
- Reconciliation recovers interrupted callbacks.
- Removed courses cannot be purchased or replayed.
- Refund handling is reviewed.
- AWS private media access is working.
- The real payment test is refunded.
