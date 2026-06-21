import { Resend } from "resend";
import "dotenv/config"

const resend = new Resend(process.env.RESEND_KEY);

export async function sendOTPMail(receiverEmail, otp) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: receiverEmail,
    subject: "Verify your Inquest account",
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2>Email Verification</h2>

        <p>Use the following code to verify your account:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 12px;
          border: 1px solid #ddd;
          text-align: center;
        ">
          ${otp}
        </div>

        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
}

export async function sendPasswordResetMail(receiverEmail, otp) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: receiverEmail,
    subject: "Reset your Shomei password",
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2>Password Reset</h2>
        <p>Use the following code to reset your password:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 12px; border: 1px solid #ddd; text-align: center;">
          ${otp}
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
}