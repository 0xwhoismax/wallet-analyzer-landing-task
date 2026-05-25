"use client";

import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";
import { api } from "./convex-api";

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? (() => {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
})();

export const convex = new ConvexReactClient(url);
export const convexHttp = new ConvexHttpClient(url);
export { api };
