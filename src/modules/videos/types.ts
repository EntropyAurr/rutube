import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type VideoGetOneOuput = inferRouterOutputs<AppRouter>["videos"]["getOne"];
