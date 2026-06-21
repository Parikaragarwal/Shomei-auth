import db from "../ultils/db.config.js";
import { eq } from "drizzle-orm";

import {
    clients,
    users
} from "../db/schema.js";

export default async function showAuthorizePage(client_id,req,res) {

    const client =
        await db.query.clients.findFirst({
            where: eq(
                clients.client_id,
                client_id
            )
        });

    if (!client) {
        throw new Error("Client not found");
    }

    const session_id =
        req.cookies.session_id;

    if (!session_id) {
        return res.redirect('/login');
    }

    const user =
        await db.query.users.findFirst({
            where: eq(
                users.session_id,
                session_id
            )
        });

    if (!user) {
        return res.redirect('/login');
        throw new Error(
            "Invalid session"
        );
    }

    return client;
}