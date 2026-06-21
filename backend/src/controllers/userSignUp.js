import db from "../ultils/db.config.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users,otpCodes } from "../db/schema.js";
import { sendOTPMail } from "../ultils/email.service.js";
import { generateOTP } from "../ultils/otp.service.js";

export default async function userSignupController(name,email,password){
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    });
    if(existingUser){
        throw new Error("Email already in use");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
        name,
        email,
        password_hash: passwordHash,
    }).returning();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60000);

    await db.insert(otpCodes).values({
        user_id: newUser.id,
        otp_code: otp,
        expires_at: expiresAt,
    });

    await sendOTPMail(email,otp);
} 