import { AlertTriangleIcon } from "lucide-react";
import { VideoGetOneOuput } from "../../types";

interface VideoBannerProps {
  status: VideoGetOneOuput["muxStatus"];
}

export function VideoBanner({ status }: VideoBannerProps) {
  if (status === "ready") return null;

  return (
    <div className="flex items-center gap-2 rounded-b-xl bg-yellow-400 px-4 py-3">
      <AlertTriangleIcon className="size-4 shrink-0 text-black" />
      <p className="line-clamp-1 text-xs font-medium text-black md:text-sm">This video is still being processed.</p>
    </div>
  );
}
