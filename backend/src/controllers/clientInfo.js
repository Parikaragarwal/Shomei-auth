import db from "../ultils/db.config.js";
import { eq } from "drizzle-orm";
import { clients } from "../db/schema.js";

export default async function getPublicClientInfo(client_id) {
    const client = await db.query.clients.findFirst({
        where: eq(clients.client_id, client_id),
        columns: {
            name: true,
            base_url: true
        }
    });

    if (!client) {
        throw new Error("Client not found");
    }

    return client;
}
