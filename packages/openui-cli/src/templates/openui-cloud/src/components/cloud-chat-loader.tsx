"use client";

import dynamic from "next/dynamic";

export const CloudChat = dynamic(() => import("./cloud-chat").then((mod) => mod.CloudChat), {
  ssr: false,
});
