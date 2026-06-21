import db from "../ultils/db.config.js";
import { eq } from "drizzle-orm";

import {
    users,
    userSessions
} from "../db/schema.js";

export default async function logoutAllController(session_id) {

    const user = await db.query.users.findFirst({
        where: eq(users.session_id, session_id)
    });

    if (!user) {
        throw new Error("Invalid session. User not found");
    }

    await db.update(users)
        .set({
            session_id: null,
        })
        .where(eq(users.id, user.id));

    await db.update(userSessions)
        .set({
            status: "revoked",
        })
        .where(eq(userSessions.user_id, user.id));
}