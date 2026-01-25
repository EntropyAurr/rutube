import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import { VideoAssetCreatedWebhookEvent, VideoAssetErroredWebhookEvent, VideoAssetReadyWebhookEvent, VideoAssetTrackReadyWebhookEvent } from "@mux/mux-node/resources/webhooks.mjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

type WebhookEvent = VideoAssetCreatedWebhookEvent | VideoAssetReadyWebhookEvent | VideoAssetErroredWebhookEvent | VideoAssetTrackReadyWebhookEvent;

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.MUX_WEBHOOK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error("Error: Please add MUX_WEBHOOK_SIGNING_SECRET from Mux Dashboard to .env or .env.local");
  }

  const headerPayload = await headers();
  const muxSignature = headerPayload.get("mux-signature");

  if (!muxSignature) {
    return new Response("No signature found", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  mux.webhooks.verifySignature(body, { "mux-signature": muxSignature }, SIGNING_SECRET);

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 400 });
      }

      await db.update(videos).set({ muxAssetId: data.id, muxStatus: data.status }).where(eq(videos.muxUploadId, data.upload_id));

      break;
    }

    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];
      const playbackId = data.playback_ids?.[0].id;

      if (!data.upload_id) {
        return new Response("Missing upload ID", { status: 400 });
      }

      if (!playbackId) {
        return new Response("Missing playback ID", { status: 400 });
      }

      const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const previewUrl = `https://image.mux.com/${playbackId}/animated.gif`;

      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          previewUrl,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id));

      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
}
