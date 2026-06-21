import { eq } from "drizzle-orm";
import { users,otpCodes } from "../db/schema.js";
import db from "../ultils/db.config.js";

export default async function verifyOTPController(email,otp){
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if(!user){
        throw new Error("User not found");
    }

    const otpCode = await db.query.otpCodes.findFirst({
        where: eq(otpCodes.user_id, user.id)
    });

    if(!otpCode){
        throw new Error("OTP not found");
    }

    if(otpCode.otp_code !== otp){
        throw new Error("Invalid OTP");
    }

    if(otpCode.expires_at < new Date()){
        throw new Error("OTP expired");
    }

    await db.update(users).set({ is_verified: true }).where(eq(users.id, user.id));

    await db.delete(otpCodes).where(eq(otpCodes.user_id, user.id));
}