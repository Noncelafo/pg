import type { Request } from "express";

export function authenticatedUser(req: Request): Express.User {
  if (!req.user) {
    throw new Error("Utente autenticato non disponibile nella richiesta");
  }
  return req.user;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
