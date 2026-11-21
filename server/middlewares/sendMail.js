import nodemailer from "nodemailer";

const getResetLinkOrigin = () =>
  (process.env.RESET_LINK_ORIGIN || "https://thevirtualcampus.me").replace(
    /\/+$/,
    "",
  );

const sendMail = async (email, subject, data) => {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.Gmail,
      pass: process.env.Password,
    },
  });

  const name = data.name
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: red;
        }
        p {
            margin-bottom: 20px;
            color: #666;
        }
        .otp {
            font-size: 36px;
            color: #7b68ee;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OTP Verification</h1>
        <p>Hello ${name}, your verification code is below.</p>
        <p class="otp">${data.otp}</p> 
    </div>
</body>
</html>
`;

  await transport.sendMail({
    from: process.env.Gmail,
    to: { address: email },
    subject,
    html,
  });
};

export default sendMail;

export const sendForgotMail = async (subject, data) => {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.Gmail,
      pass: process.env.Password,
    },
  });

  const resetUrl = `${getResetLinkOrigin()}/reset-password/${data.token}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0; mso-table-rspace: 0; }
    table { border-collapse: collapse !important; }
    body { width: 100% !important; margin: 0 !important; padding: 0 !important; background: #f4f5fb; }
    @media screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-card { padding: 32px 24px !important; }
      .email-title { font-size: 27px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f5fb; font-family:Arial,Helvetica,sans-serif; color:#172033;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    Use this secure link to choose a new Virtual Campus password. It expires in 5 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5fb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px;">
          <tr>
            <td style="padding:0 4px 20px; font-size:20px; font-weight:800; color:#24203f; letter-spacing:-0.3px;">
              <span style="display:inline-block; width:34px; height:34px; line-height:34px; margin-right:9px; border-radius:10px; background:#6d4aff; color:#ffffff; text-align:center; vertical-align:middle;">V</span>
              The Virtual Campus
            </td>
          </tr>
          <tr>
            <td class="email-card" style="padding:44px 48px; border:1px solid #e7e7f1; border-radius:22px; background:#ffffff; box-shadow:0 18px 48px rgba(33,25,74,0.09);">
              <div style="display:inline-block; padding:7px 12px; border-radius:999px; background:#f0edff; color:#6545e8; font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">Account security</div>
              <h1 class="email-title" style="margin:20px 0 12px; color:#17152b; font-size:32px; line-height:1.2; letter-spacing:-0.8px;">Reset your password</h1>
              <p style="margin:0 0 14px; color:#596174; font-size:16px; line-height:1.7;">Hello,</p>
              <p style="margin:0; color:#596174; font-size:16px; line-height:1.7;">We received a request to reset the password for your Virtual Campus account. Choose a new password using the secure button below.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 26px;">
                <tr>
                  <td align="center" bgcolor="#6d4aff" style="border-radius:12px;">
                    <a href="${resetUrl}" style="display:inline-block; padding:15px 27px; border:1px solid #6d4aff; border-radius:12px; color:#ffffff; font-size:16px; font-weight:800; line-height:1; text-decoration:none;">Create new password&nbsp; &rarr;</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px; border-radius:14px; background:#fff8e8;">
                <tr>
                  <td style="padding:15px 17px; color:#785b16; font-size:14px; line-height:1.55;"><strong>This link expires in 5 minutes</strong> and can be used only once. If it expires, request a new link from the forgot-password page.</td>
                </tr>
              </table>
              <p style="margin:0 0 8px; color:#7a8191; font-size:13px; line-height:1.6;">If the button does not work, copy and paste this address into your browser:</p>
              <p style="margin:0; padding:12px 14px; border:1px solid #e7e7f1; border-radius:10px; background:#f8f8fc; color:#6545e8; font-size:12px; line-height:1.55; word-break:break-all;"><a href="${resetUrl}" style="color:#6545e8; text-decoration:none;">${resetUrl}</a></p>
              <hr style="margin:30px 0 22px; border:0; border-top:1px solid #ececf4;">
              <p style="margin:0; color:#7a8191; font-size:14px; line-height:1.65;">Didn’t request this? You can safely ignore this email. Your password will stay unchanged.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 20px 0; color:#8a90a0; font-size:12px; line-height:1.7;">
              Sent by The Virtual Campus for account security.<br>
              <a href="https://thevirtualcampus.me" style="color:#6545e8; text-decoration:none;">thevirtualcampus.me</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  await transport.sendMail({
    from: process.env.Gmail,
    to: { address: data.email },
    subject,
    text: `Reset your Virtual Campus password\n\nOpen this secure link to choose a new password:\n${resetUrl}\n\nThis link expires in 5 minutes and can be used only once. If you did not request this, you can ignore this email.`,
    html,
  });
};
