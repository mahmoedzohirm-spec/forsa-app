import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("available"),
  userId: integer("user_id").references(() => users.id),
  userName: varchar("user_name", { length: 255 }),
  userPhone: varchar("user_phone", { length: 50 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 100 }),
  receiptImage: text("receipt_image"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const drawHistory = pgTable("draw_history", {
  id: serial("id").primaryKey(),
  prize: varchar("prize", { length: 255 }).notNull(),
  ticketNumber: integer("ticket_number").notNull(),
  winnerName: varchar("winner_name", { length: 255 }),
  winnerPhone: varchar("winner_phone", { length: 50 }),
  drawnAt: timestamp("drawn_at").defaultNow().notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  iban: varchar("iban", { length: 255 }),
  bankName: varchar("bank_name", { length: 255 }),
  accountHolder: varchar("account_holder", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
});

export const prizes = pgTable("prizes", {
  id: serial("id").primaryKey(),
  tier: integer("tier").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: text("image"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
