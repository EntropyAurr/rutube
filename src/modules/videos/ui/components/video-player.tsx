"use client";

import MuxPlayer from "@mux/mux-player-react";
import { THUMBNAIL_FALLBACK } from "../../constants";

interface VideoPlayerProps {
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  autoPlay?: boolean;
  onPlay?: () => void;
}

export function VideoPlayer({ playbackId, thumbnailUrl, autoPlay, onPlay }: VideoPlayerProps) {
  return <MuxPlayer playbackId={playbackId || ""} poster={thumbnailUrl || THUMBNAIL_FALLBACK} autoPlay={autoPlay} onPlay={onPlay} playerInitTime={0} thumbnailTime={0} className="size-full object-contain" accentColor="#ff2056" />;
}
