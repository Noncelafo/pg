import { pgTable, text, serial, integer, boolean, timestamp, date, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Persone che hanno un account (i "umani" di Resta con me)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  // Sospensione dell'account per violazione delle regole della community
  suspendedAt: timestamp("suspended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Il profilo di un animale. `status` è "alive" finché è qui a giocare con noi;
// "rainbow" quando ha attraversato il Ponte dell'Arcobaleno. Non si cancella
// niente: foto, post e coccole restano, il profilo cambia soltanto casa.
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  species: text("species").notNull(), // vedi shared/species.ts
  breed: text("breed"),
  birthDate: date("birth_date", { mode: "string" }),
  bio: text("bio"),
  // Le cose che lo rendono unico: "Adora i croccantini", "Sa fare la zampa"…
  favoriteThings: text("favorite_things"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  status: text("status").default("alive").notNull(), // alive | rainbow
  rainbowAt: date("rainbow_at", { mode: "string" }),
  rainbowMessage: text("rainbow_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  ownerIdx: index("pets_owner_idx").on(t.ownerId),
  statusIdx: index("pets_status_idx").on(t.status),
}));

// Un post è scritto da una persona a nome di un animale
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  text: text("text"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  petIdx: index("posts_pet_idx").on(t.petId, t.createdAt),
  createdIdx: index("posts_created_idx").on(t.createdAt),
}));

// Le "coccole" sono i mi piace
export const cuddles = pgTable("cuddles", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unico: unique("cuddles_post_user_unique").on(t.postId, t.userId),
}));

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  postIdx: index("comments_post_idx").on(t.postId, t.createdAt),
}));

// Chi segue quale animale
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unico: unique("follows_pet_user_unique").on(t.petId, t.userId),
}));

// Le luci del Ponte dell'Arcobaleno: una per persona, per animale, al giorno
export const lights = pgTable("lights", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  day: date("day", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unico: unique("lights_pet_user_day_unique").on(t.petId, t.userId, t.day),
}));

// Le dediche lasciate a un animale che ha attraversato il Ponte
export const tributes = pgTable("tributes", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  petIdx: index("tributes_pet_idx").on(t.petId, t.createdAt),
}));

// Segnalazioni di contenuti inappropriati
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  tributeId: integer("tribute_id").references(() => tributes.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status").default("pending").notNull(), // pending | reviewed | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Pet = typeof pets.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Tribute = typeof tributes.$inferSelect;

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().trim().min(3, "Almeno 3 caratteri").max(30, "Al massimo 30 caratteri")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Solo lettere, numeri, punto, trattino e underscore"),
  email: z.string().trim().email("Email non valida"),
  password: z.string().min(8, "Almeno 8 caratteri"),
  name: z.string().trim().max(60).optional(),
}).pick({ username: true, email: true, password: true, name: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

const dataOpzionale = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida").optional(),
);
const testoOpzionale = (max: number) => z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().max(max, `Al massimo ${max} caratteri`).optional(),
);

export const petInputSchema = z.object({
  name: z.string().trim().min(1, "Come si chiama?").max(40, "Al massimo 40 caratteri"),
  species: z.string().min(1, "Che animale è?"),
  breed: testoOpzionale(60),
  birthDate: dataOpzionale,
  bio: testoOpzionale(600),
  favoriteThings: testoOpzionale(300),
});
export type PetInput = z.infer<typeof petInputSchema>;

export const rainbowInputSchema = z.object({
  rainbowAt: dataOpzionale,
  rainbowMessage: testoOpzionale(600),
});

export const postInputSchema = z.object({
  petId: z.coerce.number().int().positive(),
  text: testoOpzionale(1000),
});

export const commentInputSchema = z.object({
  text: z.string().trim().min(1, "Scrivi qualcosa di dolce").max(500, "Al massimo 500 caratteri"),
});

export const tributeInputSchema = z.object({
  message: z.string().trim().min(1, "Scrivi qualcosa di dolce").max(500, "Al massimo 500 caratteri"),
});

export const reportInputSchema = z.object({
  petId: z.number().int().positive().optional(),
  postId: z.number().int().positive().optional(),
  commentId: z.number().int().positive().optional(),
  tributeId: z.number().int().positive().optional(),
  reason: z.string().trim().min(3, "Raccontaci cosa non va").max(500),
}).refine((v) => [v.petId, v.postId, v.commentId, v.tributeId].filter(Boolean).length === 1, {
  message: "Indica cosa vuoi segnalare",
});

// Forme dei dati restituiti dalle API (condivise con il client)
export interface PetSummary {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  avatarUrl: string | null;
  status: "alive" | "rainbow";
  rainbowAt: string | null;
}

export interface PetProfile extends PetSummary {
  ownerId: number;
  ownerName: string;
  birthDate: string | null;
  bio: string | null;
  favoriteThings: string | null;
  coverUrl: string | null;
  rainbowMessage: string | null;
  followers: number;
  posts: number;
  lights: number;
  isOwner: boolean;
  isFollowing: boolean;
  lightedToday: boolean;
}

export interface PostView {
  id: number;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
  pet: PetSummary;
  authorId: number;
  cuddles: number;
  comments: number;
  cuddled: boolean;
  canDelete: boolean;
}

export interface CommentView {
  id: number;
  text: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  canDelete: boolean;
}

export interface TributeView {
  id: number;
  message: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  canDelete: boolean;
}
