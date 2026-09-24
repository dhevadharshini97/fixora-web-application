import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const citizens = pgTable("citizens", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  age: integer("age"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  language: text("language").default("en"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  citizenId: integer("citizen_id"),
  citizenName: text("citizen_name"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("Medium"),
  department: text("department"),
  rootCause: text("root_cause"),
  photoUrl: text("photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  street: text("street"),
  city: text("city"),
  status: text("status").notNull().default("submitted"),
  // submitted | ai_verified | assigned | in_progress | resolved | verified | reopened
  problemDna: text("problem_dna").unique(),
  recurringOfDna: text("recurring_of_dna"),
  supporters: integer("supporters").default(1),
  slaDays: integer("sla_days").default(7),
  escalationLevel: integer("escalation_level").default(0),
  reopenCount: integer("reopen_count").default(0),
  deadline: timestamp("deadline", { mode: "string" }),
  reportedAt: timestamp("reported_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { mode: "string" }),
  verifiedAt: timestamp("verified_at", { mode: "string" }),
});

export type Complaint = typeof complaints.$inferSelect;
export type Citizen = typeof citizens.$inferSelect;
