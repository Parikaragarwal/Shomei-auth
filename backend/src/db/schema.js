import * as p from "drizzle-orm/pg-core";

export const sessionStatus = p.pgEnum("session_status", ["active", "revoked","expired"]);

export const users = p.pgTable("users", {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  email: p.varchar().notNull().unique(),
  is_verified: p.boolean().default(false),
  password_hash: p.varchar().notNull(),
  name: p.varchar().notNull(),
  session_id: p.varchar().unique(),
  created_at: p.timestamp().defaultNow(),
});

export const clients = p.pgTable("clients",{
  client_id: p.varchar().primaryKey(),
  owner_id: p.integer().notNull().references(() => users.id),
  client_secret_hash: p.varchar().notNull(),
  name: p.varchar().notNull(),
  base_url: p.varchar().notNull(),
  redirect_uri:p.varchar().notNull(),
  created_at: p.timestamp().defaultNow(),
});

export const userSessions = p.pgTable("user_sessions",{
  session_id: p.varchar().primaryKey(),
  user_id: p.integer().notNull().references(() => users.id),
  client_id: p.varchar().notNull().references(() => clients.client_id),
  created_at: p.timestamp().defaultNow(),
  expires_at: p.timestamp().notNull(),
  status: sessionStatus("status").notNull().default("active"),
});


export const refreshTokens = p.pgTable("refresh_tokens",{
  id:p.integer().primaryKey().generatedAlwaysAsIdentity(),
  token: p.varchar().notNull().unique(),
  client_id: p.varchar().notNull().references(() => clients.client_id),
  user_id: p.integer().notNull().references(() => users.id),
  revoked: p.boolean().default(false),
  expires_at: p.timestamp().notNull(),
  created_at: p.timestamp().defaultNow(),
});

export const otpCodes = p.pgTable("otp_codes",{
  otp_id:p.integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: p.integer().notNull().references(() => users.id),
  otp_code: p.varchar(6).notNull(),
  intent: p.varchar("intent").notNull().default("verification"),
  expires_at: p.timestamp().notNull(),
});