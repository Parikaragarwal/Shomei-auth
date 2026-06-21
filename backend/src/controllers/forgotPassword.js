import db from "../ultils/db.config.js";
import { eq } from "drizzle-orm";
import { users, otpCodes } from "../db/schema.js";
import { generateOTP } from "../ultils/otp.service.js";
import { sendPasswordResetMail } from "../ultils/email.service.js";

export default async function forgotPasswordController(email) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    return; // Prevent email enumeration
  }

  const otp = generateOTP();

  await db.insert(otpCodes).values({
    user_id: user.id,
    otp_code: otp,
    intent: 'reset',
    expires_at: new Date(Date.now() + 10 * 60 * 1000)
  });

  await sendPasswordResetMail(email, otp);
}
