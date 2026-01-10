"use client";

import { trpc } from "@/trpc/client";

export function PageClient() {
  const [data] = trpc.hello.useSuspenseQuery({
    text: "Aurora",
  });

  return <div>Page client says: {data.greeting}</div>;
}
