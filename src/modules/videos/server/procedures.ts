import { db } from "@/db";
import { users, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import z from "zod";

export const videosRouter = createTRPCRouter({
  getOne: baseProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const [existingVideo] = await db
      .select({ ...getTableColumns(videos), user: { ...getTableColumns(users) }, viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)) })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.id, input.id));

    if (!existingVideo) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return existingVideo;
  }),

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
