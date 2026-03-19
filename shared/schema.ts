import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const rsvps = pgTable(
  "rsvps",
  {
    id: varchar("id").primaryKey(),
    fullName: text("full_name").notNull(),
    telegram: text("telegram").notNull(),
    phone: text("phone").notNull(),
    transfer: text("transfer").notNull(),
    drinks: text("drinks").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("rsvps_telegram_lower_unique_idx").on(sql`lower(${table.telegram})`),
  ],
);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
