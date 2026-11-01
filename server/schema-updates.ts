import { pool } from "./db";

/**
 * Crea le tabelle se mancano e aggiunge le colonne nuove. Tutto idempotente
 * (IF NOT EXISTS): si può rieseguire a ogni avvio senza rischi.
 *
 * Si usa questo al posto di `drizzle-kit push`, che sul database di
 * produzione propone di eliminare la tabella `session` (non è nello schema
 * Drizzle). Lezione imparata su Vivo con te.
 *
 * ⚠️ Va tenuto allineato a shared/schema.ts: per una colonna nuova aggiungi
 * qui una riga `ALTER TABLE … ADD COLUMN IF NOT EXISTS …`.
 */
const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    email text NOT NULL UNIQUE,
    name text,
    is_admin boolean NOT NULL DEFAULT false,
    suspended_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS pets (
    id serial PRIMARY KEY,
    owner_id integer NOT NULL REFERENCES users(id),
    name text NOT NULL,
    species text NOT NULL,
    breed text,
    birth_date date,
    bio text,
    favorite_things text,
    avatar_url text,
    cover_url text,
    status text NOT NULL DEFAULT 'alive',
    rainbow_at date,
    rainbow_message text,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS pets_owner_idx ON pets (owner_id)`,
  `CREATE INDEX IF NOT EXISTS pets_status_idx ON pets (status)`,
  `CREATE TABLE IF NOT EXISTS posts (
    id serial PRIMARY KEY,
    pet_id integer NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    author_id integer NOT NULL REFERENCES users(id),
    text text,
    image_url text,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS posts_pet_idx ON posts (pet_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS posts_created_idx ON posts (created_at)`,
  `CREATE TABLE IF NOT EXISTS cuddles (
    id serial PRIMARY KEY,
    post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT cuddles_post_user_unique UNIQUE (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id serial PRIMARY KEY,
    post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id integer NOT NULL REFERENCES users(id),
    text text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS comments_post_idx ON comments (post_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS follows (
    id serial PRIMARY KEY,
    pet_id integer NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT follows_pet_user_unique UNIQUE (pet_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS lights (
    id serial PRIMARY KEY,
    pet_id integer NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id),
    day date NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT lights_pet_user_day_unique UNIQUE (pet_id, user_id, day)
  )`,
  `CREATE TABLE IF NOT EXISTS tributes (
    id serial PRIMARY KEY,
    pet_id integer NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    author_id integer NOT NULL REFERENCES users(id),
    message text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS tributes_pet_idx ON tributes (pet_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS reports (
    id serial PRIMARY KEY,
    reporter_id integer NOT NULL REFERENCES users(id),
    pet_id integer REFERENCES pets(id) ON DELETE CASCADE,
    post_id integer REFERENCES posts(id) ON DELETE CASCADE,
    comment_id integer REFERENCES comments(id) ON DELETE CASCADE,
    tribute_id integer REFERENCES tributes(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    pet_id integer REFERENCES pets(id) ON DELETE SET NULL,
    symbol text,
    engraved_text text,
    color text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    note text,
    status text NOT NULL DEFAULT 'new',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at)`,
];

export async function applySchemaUpdates(): Promise<void> {
  try {
    for (const statement of STATEMENTS) {
      await pool.query(statement);
    }
  } catch (error) {
    console.error("[db] aggiornamento schema non riuscito:", error);
    throw error;
  }
}
