import db from "../ultils/db.config.js";
import { and, eq } from "drizzle-orm";
import { clients, userSessions, users } from "../db/schema.js";

// Fetch third-party apps the user is actively logged into
export async function getUserActiveSessions(sessionId) {
  if (!sessionId) throw new Error("Unauthorized");
  
  const user = await db.query.users.findFirst({
    where: eq(users.session_id, sessionId)
  });

  if (!user) throw new Error("Invalid session");

  // Get all active sessions for this user (third-party apps)
  const allSessions = await db.select({
    session_id: userSessions.session_id,
    client_id: userSessions.client_id,
    created_at: userSessions.created_at,
    client_name: clients.name
  })
  .from(userSessions)
  .leftJoin(clients, eq(userSessions.client_id, clients.client_id))
  .where(
    and(
      eq(userSessions.user_id, user.id),
      eq(userSessions.status, "active")
    )
  );

  return allSessions;
}

// Revoke access to a specific app (by client_id)
export async function revokeAppAccess(sessionId, targetClientId) {
  if (!sessionId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.session_id, sessionId)
  });

  if (!user) throw new Error("Invalid session");

  await db.update(userSessions)
    .set({ status: "revoked" })
    .where(
      and(
        eq(userSessions.user_id, user.id),
        eq(userSessions.client_id, targetClientId),
        eq(userSessions.status, "active")
      )
    );

  return { success: true };
}

// Revoke access globally (all apps)
export async function revokeAllAccess(sessionId) {
  if (!sessionId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.session_id, sessionId)
  });

  if (!user) throw new Error("Invalid session");

  await db.update(userSessions)
    .set({ status: "revoked" })
    .where(
      and(
        eq(userSessions.user_id, user.id),
        eq(userSessions.status, "active")
      )
    );

  return { success: true };
}

// Fetch all OAuth apps owned by the user
export async function getUserOwnedClients(sessionId) {
  if (!sessionId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.session_id, sessionId)
  });

  if (!user) throw new Error("Invalid session");

  const ownedClients = await db.query.clients.findMany({
    where: eq(clients.owner_id, user.id),
    columns: {
      client_id: true,
      name: true,
      base_url: true,
      redirect_uri: true,
      created_at: true
    }
  });

  return ownedClients;
}

// Fetch active users for a specific client (only for the client owner)
export async function getClientActiveUsers(sessionId, targetClientId) {
  if (!sessionId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.session_id, sessionId)
  });

  if (!user) throw new Error("Invalid session");

  // Verify the user owns this client
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.client_id, targetClientId),
      eq(clients.owner_id, user.id)
    )
  });

  if (!client) throw new Error("Unauthorized or Client not found");

  // Manual join to get user email and name without relying on Drizzle relations
  const activeSessions = await db.select({
    session_id: userSessions.session_id,
    created_at: userSessions.created_at,
    expires_at: userSessions.expires_at,
    user_id: users.id,
    user_email: users.email,
    user_name: users.name
  })
  .from(userSessions)
  .innerJoin(users, eq(userSessions.user_id, users.id))
  .where(
    and(
      eq(userSessions.client_id, targetClientId),
      eq(userSessions.status, "active")
    )
  );

  return activeSessions;
}
