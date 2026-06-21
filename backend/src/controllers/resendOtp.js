import { eq } from "drizzle-orm";
import { users,otpCodes } from "../db/schema.js";
import db from "../ultils/db.config.js";
import { generateOTP } from "../ultils/otp.service.js";
import { sendOTPMail } from "../ultils/email.service.js";

export default async function resendOTPController(email){
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });
    if(!user){
        throw new Error("User not found");
    }
    const otpCode = await db.query.otpCodes.findFirst({
        where: eq(otpCodes.user_id, user.id)
    });
    if(otpCode){
        await db.delete(otpCodes).where(eq(otpCodes.user_id, user.id));
    }
    const otp = generateOTP();
    await db.insert(otpCodes).values({
        user_id: user.id,
        otp_code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendOTPMail(email, otp);
}