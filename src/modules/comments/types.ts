import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type CommentsGetManyOuput = inferRouterOutputs<AppRouter>["comments"]["getMany"];
