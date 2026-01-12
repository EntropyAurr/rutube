"use client"; // to make sure we can mount the Provider from a server component

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;

// Server check
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client

  return (clientQueryClientSingleton ??= makeQueryClient());
  // If clientQueryClientSingleton is null or undefined, assign it the value of makeQueryClient(). Otherwise, just return the existing one. This ensures that once the user's browser creates that first client, it stays in memory. Even if React re-renders entire app, it won't create a second client, which would wipe out the cache.
}

function getUrl() {
  const base = (() => {
    // if on the brower
    if (typeof window !== "undefined") return "";

    // if on the server
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

    // local development case
    return "http://localhost:3000";
  })();

  return `${base}/api/trpc`;
}

export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson, // if you use a data transformer

          url: getUrl(),

          // identify in the server logs exactly where a request is coming from
          async headers() {
            const headers = new Headers();

            headers.set("x-trpc-source", "nextjs-react");

            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </trpc.Provider>
  );
}
