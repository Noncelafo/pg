import { and, desc, eq, lt, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "./db";
import {
  pets, posts, users, cuddles, comments, follows, lights, tributes,
  type PetSummary, type PetProfile, type PostView, type CommentView, type TributeView,
} from "@shared/schema";

/** Giorno di oggi in Italia (YYYY-MM-DD): le luci si accendono una volta al giorno. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

export const petSummaryColumns = {
  id: pets.id,
  name: pets.name,
  species: pets.species,
  breed: pets.breed,
  avatarUrl: pets.avatarUrl,
  status: pets.status,
  rainbowAt: pets.rainbowAt,
};

function asSummary(row: { id: number; name: string; species: string; breed: string | null; avatarUrl: string | null; status: string; rainbowAt: string | null }): PetSummary {
  return { ...row, status: row.status === "rainbow" ? "rainbow" : "alive" };
}

/** Elenco di animali (esplora, i miei animali, Ponte). */
export async function listPets(opts: { where?: SQL; limit?: number; offset?: number; order?: (SQL | PgColumn)[] } = {}): Promise<PetSummary[]> {
  const rows = await db.select(petSummaryColumns).from(pets)
    .where(opts.where)
    .orderBy(...(opts.order ?? [desc(pets.createdAt)]))
    .limit(opts.limit ?? 30)
    .offset(opts.offset ?? 0);
  return rows.map(asSummary);
}

export async function getPetProfile(id: number, viewerId: number | null): Promise<PetProfile | null> {
  const [row] = await db.select({
    ...petSummaryColumns,
    ownerId: pets.ownerId,
    ownerName: sql<string>`coalesce(${users.name}, ${users.username})`,
    birthDate: pets.birthDate,
    bio: pets.bio,
    favoriteThings: pets.favoriteThings,
    coverUrl: pets.coverUrl,
    rainbowMessage: pets.rainbowMessage,
    followers: sql<number>`(select count(*)::int from ${follows} where ${follows.petId} = ${pets.id})`,
    posts: sql<number>`(select count(*)::int from ${posts} where ${posts.petId} = ${pets.id})`,
    lights: sql<number>`(select count(*)::int from ${lights} where ${lights.petId} = ${pets.id})`,
    isFollowing: viewerId
      ? sql<boolean>`exists(select 1 from ${follows} where ${follows.petId} = ${pets.id} and ${follows.userId} = ${viewerId})`
      : sql<boolean>`false`,
    lightedToday: viewerId
      ? sql<boolean>`exists(select 1 from ${lights} where ${lights.petId} = ${pets.id} and ${lights.userId} = ${viewerId} and ${lights.day} = ${today()})`
      : sql<boolean>`false`,
  }).from(pets).innerJoin(users, eq(users.id, pets.ownerId)).where(eq(pets.id, id));
  if (!row) return null;
  return { ...asSummary(row), ...row, status: row.status === "rainbow" ? "rainbow" : "alive", isOwner: viewerId === row.ownerId };
}

export interface PostFilter {
  where?: SQL;
  beforeId?: number;
  limit?: number;
}

/** Post con conteggi e stato "coccolato" per chi guarda. Dal più recente. */
export async function listPosts(viewerId: number | null, isAdmin: boolean, filter: PostFilter = {}): Promise<PostView[]> {
  const conditions = [filter.where, filter.beforeId ? lt(posts.id, filter.beforeId) : undefined].filter(Boolean) as SQL[];
  const rows = await db.select({
    id: posts.id,
    text: posts.text,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    authorId: posts.authorId,
    ownerId: pets.ownerId,
    pet: petSummaryColumns,
    cuddles: sql<number>`(select count(*)::int from ${cuddles} where ${cuddles.postId} = ${posts.id})`,
    comments: sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${posts.id})`,
    cuddled: viewerId
      ? sql<boolean>`exists(select 1 from ${cuddles} where ${cuddles.postId} = ${posts.id} and ${cuddles.userId} = ${viewerId})`
      : sql<boolean>`false`,
  }).from(posts)
    .innerJoin(pets, eq(pets.id, posts.petId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.id))
    .limit(filter.limit ?? 10);

  return rows.map(({ ownerId, pet, createdAt, ...rest }) => ({
    ...rest,
    createdAt: createdAt.toISOString(),
    pet: asSummary(pet),
    canDelete: isAdmin || viewerId === rest.authorId || viewerId === ownerId,
  }));
}

export async function listComments(postId: number, viewerId: number | null, isAdmin: boolean): Promise<CommentView[]> {
  const rows = await db.select({
    id: comments.id,
    text: comments.text,
    createdAt: comments.createdAt,
    authorId: comments.authorId,
    authorName: sql<string>`coalesce(${users.name}, ${users.username})`,
    postOwnerId: pets.ownerId,
  }).from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .innerJoin(posts, eq(posts.id, comments.postId))
    .innerJoin(pets, eq(pets.id, posts.petId))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
  return rows.map(({ postOwnerId, createdAt, ...rest }) => ({
    ...rest,
    createdAt: createdAt.toISOString(),
    canDelete: isAdmin || viewerId === rest.authorId || viewerId === postOwnerId,
  }));
}

export async function listTributes(petId: number, viewerId: number | null, isAdmin: boolean): Promise<TributeView[]> {
  const rows = await db.select({
    id: tributes.id,
    message: tributes.message,
    createdAt: tributes.createdAt,
    authorId: tributes.authorId,
    authorName: sql<string>`coalesce(${users.name}, ${users.username})`,
    petOwnerId: pets.ownerId,
  }).from(tributes)
    .innerJoin(users, eq(users.id, tributes.authorId))
    .innerJoin(pets, eq(pets.id, tributes.petId))
    .where(eq(tributes.petId, petId))
    .orderBy(desc(tributes.createdAt))
    .limit(100);
  return rows.map(({ petOwnerId, createdAt, ...rest }) => ({
    ...rest,
    createdAt: createdAt.toISOString(),
    canDelete: isAdmin || viewerId === rest.authorId || viewerId === petOwnerId,
  }));
}
