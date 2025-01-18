import { int, sqliteTable, text ,} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull(),
  pkey: int().notNull(),
  reputation : int(),
});




export const reportsTable = sqliteTable("reports", {
  id: int().primaryKey({ autoIncrement: true }),
  user_id: int("user_id").references(() => usersTable.id),
  report_text: text("report_text").notNull(),
  created_at: int({mode: "timestamp_ms"}).default(sql`(CURRENT_TIMESTAMP)`),
});


