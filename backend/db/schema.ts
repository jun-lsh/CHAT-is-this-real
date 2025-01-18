import { int, sqliteTable, text, index ,} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull(),
  pkey: text().notNull(),
  reputation : int(),
});




export const reports = sqliteTable("reports", {
  id: int().primaryKey({ autoIncrement: true }),
  user_id: int("user_id").references(() => users.id, { onDelete: 'cascade' }),
  report_hash: text("report_hash").notNull(),
  report_text: text("report_text").notNull(),
  created_at: int({mode: "timestamp_ms"}).default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  report_hash_idx: index("report_hash_idx").on(table.report_hash),
}));


export const report_votes = sqliteTable("report_votes", {
  id: int().primaryKey({ autoIncrement: true }),
  report_id: int("report_id").references(() => reports.id, { onDelete: 'cascade' }),
  report_hash: text("report_hash"),
  user_id: int("user_id").references(() => users.id, { onDelete: 'cascade' }),
  upvote: int("upvote").notNull(),
  downvote: int("downvote").notNull(),
  created_at: int({mode: "timestamp_ms"}).default(sql`(CURRENT_TIMESTAMP)`),
});


