"use client";

import { trpc } from "@/trpc/client";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { StudioUploader } from "./studio-uploader";
import { useRouter } from "next/navigation";

export function StudioUploadModal() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Video successfully created!");
      utils.studio.getMany.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleSuccess() {
    if (!create.data?.video.id) return;

    create.reset();

    router.push(`/studio/videos/${create.data.video.id}`);
  }

  return (
    <>
      <ResponsiveModal title="Upload a video" open={!!create.data} onOpenChange={() => create.reset()}>
        {create.data?.url ? <StudioUploader endpoint={create.data?.url} onSuccess={handleSuccess} /> : <Loader2Icon />}
      </ResponsiveModal>

      <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
        {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Create
      </Button>
    </>
  );
}
