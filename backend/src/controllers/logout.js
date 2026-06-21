import db from "../ultils/db.config.js";
import { eq } from "drizzle-orm";

import {
    users
} from "../db/schema.js";

export default async function logoutController(session_id) {
    if (!session_id) return;

    const user = await db.query.users.findFirst({
        where: eq(users.session_id, session_id)
    });

    if (!user) return;

    await db.update(users)
        .set({
            session_id: null,
        })
        .where(eq(users.id, user.id));
}
