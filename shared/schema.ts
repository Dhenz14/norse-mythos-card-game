import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Think Tools Session Model
export const thinkToolsSessions = pgTable("think_tools_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  query: text("query").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reasoning Results Model
export const reasoningResults = pgTable("reasoning_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => thinkToolsSessions.id, { onDelete: 'cascade' }),
  reasoningMode: text("reasoning_mode").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reasoning Metrics Model
export const reasoningMetrics = pgTable("reasoning_metrics", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => thinkToolsSessions.id, { onDelete: 'cascade' }),
  reasoningMode: text("reasoning_mode").notNull(),
  durationMs: integer("duration_ms"),
  stepsCount: integer("steps_count"),
  insightsCount: integer("insights_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertSessionSchema = createInsertSchema(thinkToolsSessions).pick({
  userId: true,
  title: true,
  query: true,
});

export const insertResultSchema = createInsertSchema(reasoningResults).pick({
  sessionId: true,
  reasoningMode: true,
  content: true,
  orderIndex: true,
});

export const insertMetricsSchema = createInsertSchema(reasoningMetrics).pick({
  sessionId: true,
  reasoningMode: true,
  durationMs: true,
  stepsCount: true,
  insightsCount: true,
});

// Types
export type ThinkToolsSession = typeof thinkToolsSessions.$inferSelect;
export type InsertThinkToolsSession = z.infer<typeof insertSessionSchema>;

export type ReasoningResult = typeof reasoningResults.$inferSelect;
export type InsertReasoningResult = z.infer<typeof insertResultSchema>;

export type ReasoningMetric = typeof reasoningMetrics.$inferSelect;
export type InsertReasoningMetric = z.infer<typeof insertMetricsSchema>;
