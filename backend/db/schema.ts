import { int, sqliteTable, text, index ,} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { platform } from "os";

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
  report_type : text("report_type").notNull(),
  platform_name : text("platform_name").notNull(),
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


export const user_group_kv = sqliteTable("user_group_kv", {
  id: int().primaryKey({ autoIncrement: true }),
  user_id: int("user_id").references(() => users.id, { onDelete: 'cascade' }),
  group_id: int("group_id").references(() => user_groups.id, { onDelete: 'cascade' }),
  created_at: int({mode: "timestamp_ms"}).default(sql`(CURRENT_TIMESTAMP)`),
});


export const user_groups = sqliteTable("user_groups", {
  id: int().primaryKey({ autoIncrement: true }),
  group_name: text("group_name").notNull().unique(),
  group_description: text("group_description").notNull(),
  created_at: int({mode: "timestamp_ms"}).default(sql`(CURRENT_TIMESTAMP)`),
});