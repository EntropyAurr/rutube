import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const subscriptionsRouter = createTRPCRouter({
  create: protectedProcedure.input(z.object({ targetSubscribedId: z.uuid() })).mutation(async ({ input, ctx }) => {
    const { targetSubscribedId } = input; // the target user’s ID (the person to be subscribed to)

    // prevents a user from subscribing to themselves
    if (targetSubscribedId === ctx.user.id) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const [createdSubscription] = await db.insert(subscriptions).values({ viewerId: ctx.user.id, creatorId: targetSubscribedId }).returning(); // viewerId: the current user (the subscriber)

    return createdSubscription;
  }),
  remove: protectedProcedure.input(z.object({ targetSubscribedId: z.uuid() })).mutation(async ({ input, ctx }) => {
    const { targetSubscribedId } = input;

    if (targetSubscribedId === ctx.user.id) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const [deletedSubscription] = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.viewerId, ctx.user.id), eq(subscriptions.creatorId, targetSubscribedId)))
      .returning();

    return deletedSubscription;
  }),
});
