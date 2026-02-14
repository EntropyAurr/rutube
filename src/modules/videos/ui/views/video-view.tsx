import { VideoSection } from "../sections/video-section";

interface VideoViewProps {
  videoId: string;
}

export function VideoView({ videoId }: VideoViewProps) {
  return (
    <div className="mx-auto mb-10 flex max-w-[1700px] flex-col px-4 pt-2.5">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <VideoSection videoId={videoId} />
        </div>
      </div>
    </div>
  );
}
