import { drizzle } from "drizzle-orm/neon-http";

// Connect Drizzle ORM to the database
export const db = drizzle(process.env.DATABASE_URL!);
