import { db } from "@/db";
import { users, videoReactions, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import z from "zod";

export const videosRouter = createTRPCRouter({
  // GET DATA OF A VIDEO
  getOne: baseProcedure.input(z.object({ id: z.uuid() })).query(async ({ input, ctx }) => {
    const { clerkUserId } = ctx;

    let userId;

    const [user] = await db
      .select()
      .from(users)
      .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

    if (user) {
      userId = user.id;
    }

    // using "with" clause to simplify complex queries by splitting them into smaller subqueries called common table expressions (CTEs)
    const viewerReactions = db.$with("viewer_reactions").as(
      db
        .select({
          videoId: videoReactions.videoId,
          type: videoReactions.type,
        })
        .from(videoReactions)
        .where(inArray(videoReactions.userId, userId ? [userId] : [])),
    );

    const [existingVideo] = await db
      .with(viewerReactions)
      .select({
        ...getTableColumns(videos), // get all video columns
        user: { ...getTableColumns(users) }, // create nested user object that contains all user columns
        viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)), // aggregate: total views
        likeCount: db.$count(videoReactions, and(eq(videoReactions.videoId, videos.id), eq(videoReactions.type, "like"))),
        dislikeCount: db.$count(videoReactions, and(eq(videoReactions.videoId, videos.id), eq(videoReactions.type, "dislike"))),
        viewerReaction: viewerReactions.type,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id)) // join users
      .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id)) // join viewerReactions
      .where(eq(videos.id, input.id)) // filter by video ID
      .groupBy(videos.id, users.id, viewerReactions.type); // group for aggregates

    if (!existingVideo) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return existingVideo;
  }),

  // CREATE NEW VIDEO
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policies: ["public"],
        inputs: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
        static_renditions: [{ resolution: "1080p" }],
      },
      cors_origin: "*",
    });

    const [video] = await db.insert(videos).values({ userId, title: "Untitled", muxStatus: "waiting", muxUploadId: upload.id }).returning();

    return { video: video, url: upload.url };
  }),

  // UPDATE VIDEO
  update: protectedProcedure.input(videoUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;

    if (!input.id) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const [updatedVideo] = await db
      .update(videos)
      .set({
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        visibility: input.visibility as "private" | "public",
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
      .returning();

    return updatedVideo;
  }),

  // REMOVE VIDEO
  remove: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;

    const [removedVideo] = await db
      .delete(videos)
      .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
      .returning();

    if (!removedVideo) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return removedVideo;
  }),

  // RESTORE THUMBNAIL
  restoreThumbnail: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;

    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

    if (!existingVideo) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (existingVideo.thumbnailKey) {
      const utApi = new UTApi();

      await utApi.deleteFiles(existingVideo.thumbnailKey);
      await db
        .update(videos)
        .set({ thumbnailKey: null, thumbnailUrl: null })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
    }

    if (!existingVideo.muxPlaybackId) {
      throw new TRPCError({ code: "BAD_REQUEST" });
    }

    const utApi = new UTApi();

    const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
    const uploadedThumbnail = await utApi.uploadFilesFromUrl(tempThumbnailUrl);

    if (!uploadedThumbnail.data) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;

    const [updatedVideo] = await db
      .update(videos)
      .set({ thumbnailUrl, thumbnailKey })
      .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
      .returning();

    return updatedVideo;
  }),
});
