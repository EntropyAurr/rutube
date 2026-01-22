// Initialize tRPC

import { db } from "@/db";
import { users } from "@/db/schema";
import { ratelimit } from "@/lib/ratelimit";
import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  const { userId } = await auth();

  return { clerkUserId: userId }; // this is ctx. This context will be available in all tRPC procedures
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router; // function to create API routers
export const createCallerFactory = t.createCallerFactory; // creates server-side callers for tRPC procedures
export const baseProcedure = t.procedure; // basic procedure with no middleware (public endpoints)

export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx } = opts; // extracts context from the procedure call (options)

  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const [user] = await db.select().from(users).where(eq(users.clerkId, ctx.clerkUserId)).limit(1);

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { success } = await ratelimit.limit(user.id);

  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user,
    },
  });

  // If all checks pass, calls next() to continue to the actual procedure
  // Adds the full user object to context
  // Now any procedure using protectedProcedure has access to ctx.user
});
