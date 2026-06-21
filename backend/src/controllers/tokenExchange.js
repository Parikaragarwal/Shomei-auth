import db from "../ultils/db.config.js";
import bcrypt from "bcrypt";
import { and, eq, gt } from "drizzle-orm";
import {
  clients,
  users,
  refreshTokens,
  userSessions
} from "../db/schema.js";

import crypto from "node:crypto";
import {
  signAccessToken
} from "../ultils/token.service.js";
import redisClient from "../ultils/redis.client.js";

export default async function tokenExchangeController(
  shortcode,
  clientId,
  clientSecret,
  codeVerifier
) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.client_id, clientId)
  });

  if (!client) {
    throw new Error("Invalid client credentials");
  }

  const secretMatch =
    await bcrypt.compare(
      clientSecret,
      client.client_secret_hash
    );

  if (!secretMatch) {
    throw new Error("Invalid client credentials");
  }

  const redisKey = `auth_code:${shortcode}`;
  const authCodeData = await redisClient.get(redisKey);

  if (!authCodeData) {
    throw new Error(
      "Invalid or expired authorization code"
    );
  }

  const authCode = JSON.parse(authCodeData);

  if (authCode.client_id !== clientId) {
     throw new Error("Invalid authorization code for this client");
  }
  
  if (authCode.code_challenge) {
    if (!codeVerifier) {
      throw new Error("code_verifier is required for PKCE");
    }
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    if (hash !== authCode.code_challenge) {
      throw new Error("Invalid code_verifier");
    }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, authCode.user_id)
  });

  if (!user) {
    throw new Error(
      "User associated with authorization code not found"
    );
  }

  await redisClient.del(redisKey);

  const access_token = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    client_id: clientId
  });
  
  const refresh_token = crypto.randomBytes(32).toString('hex');
  await db.insert(refreshTokens).values({
    token: refresh_token,
    client_id: clientId,
    user_id: user.id,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  const oauthSessionId = crypto.randomUUID();
  await db.insert(userSessions).values({
    session_id: oauthSessionId,
    client_id: clientId,
    user_id: user.id,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "active"
  });

  return { access_token, refresh_token };
}