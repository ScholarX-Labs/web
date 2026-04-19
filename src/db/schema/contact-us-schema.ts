import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status_enum", ["pending", "resolved"]);

export const contactUs = pgTable("contact_us", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  message: text("message").notNull(),
  status: statusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
