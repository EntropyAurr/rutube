import { VideoGetOneOuput } from "../../types";
import { VideoOwner } from "./video-owner";

interface VideoTopRowProps {
  video: VideoGetOneOuput;
}

export function VideoTopRow({ video }: VideoTopRowProps) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <VideoOwner user={video.user} videoId={video.id} />
      </div>
    </div>
  );
}
