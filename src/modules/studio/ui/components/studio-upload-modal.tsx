"use client";

import { trpc } from "@/trpc/client";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StudioUploadModal() {
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

  return (
    <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
      {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
      Create
    </Button>
  );
}
