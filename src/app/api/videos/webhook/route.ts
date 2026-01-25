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
    return new Response("No signature found", { status: 401 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  mux.webhooks.verifySignature(body, { "mux-signature": muxSignature }, SIGNING_SECRET);

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];

      if (!data.upload_id) {
        return new Response("No upload ID found", { status: 401 });
      }

      await db.update(videos).set({ muxAssetId: data.id, muxStatus: data.status }).where(eq(videos.muxUploadId, data.upload_id));

      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
}
