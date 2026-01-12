// allow you to fetch data directly on the server (inside Next.js Server Components) and "dehydrate" that data so the client-side has it ready the moment the page loads

import "server-only"; // <-- ensure this file cannot be imported from the client

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { createTRPCContext, createCallerFactory } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

const caller = createCallerFactory(appRouter)(createTRPCContext);

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(caller, getQueryClient);

// trpc: use this inside your Server Components to fetch data
// HydrateClient: This is a wrapper component. When you fetch data on the server using the trpc helper above, the data is stored in the server-side QueryClient. When wrap the page in <HydrateClient>, it takes all that fetched data, serializes it into JSON, and "injects" it into the HTML
