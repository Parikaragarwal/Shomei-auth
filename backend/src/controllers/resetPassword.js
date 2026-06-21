import db from "../ultils/db.config.js";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { users, otpCodes, userSessions } from "../db/schema.js";

export default async function resetPasswordController(email, otp, newPassword) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    throw new Error("Invalid email or OTP");
  }

  const codeRecord = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.user_id, user.id),
      eq(otpCodes.otp_code, otp),
      eq(otpCodes.intent, 'reset'),
      gt(otpCodes.expires_at, new Date())
    )
  });

  if (!codeRecord) {
    throw new Error("Invalid or expired reset code");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await db.update(users).set({ password_hash: hashedPassword }).where(eq(users.id, user.id));

  // Invalidate all active sessions for security
  await db.update(userSessions).set({ status: 'revoked' }).where(eq(userSessions.user_id, user.id));

  // Delete the OTP
  await db.delete(otpCodes).where(eq(otpCodes.otp_id, codeRecord.otp_id));
}
