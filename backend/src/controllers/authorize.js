import db from "../ultils/db.config.js";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import {
  clients,
  users
} from "../db/schema.js";
import redisClient from "../ultils/redis.client.js";

export default async function authorizeController(client_id,req, code_challenge, code_challenge_method) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.client_id, client_id)
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const userSessionId = req.cookies.session_id;
  if (!userSessionId) {
    throw new Error("User not authenticated");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.session_id, userSessionId)
  });

  if (!user) {
    throw new Error("Invalid session. User not found");
  }

  const shortcode =
    crypto.randomBytes(16).toString("hex");

  const payload = {
    client_id: client.client_id,
    user_id: user.id,
    code_challenge,
    code_challenge_method
  };

  await redisClient.set(`auth_code:${shortcode}`, JSON.stringify(payload), 'EX', 300);

  return {
    redirect_uri: client.redirect_uri,
    shortcode
  };
}