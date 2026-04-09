import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "typecraft-dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number } {
  return jwt.verify(token, JWT_SECRET) as { userId: number };
}
