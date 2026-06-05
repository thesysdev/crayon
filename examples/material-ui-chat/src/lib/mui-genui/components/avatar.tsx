"use client";

import MuiAvatar from "@mui/material/Avatar";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const Avatar = defineComponent({
  name: "Avatar",
  props: z.object({ name: z.string(), image: z.string().optional() }),
  description: "User avatar with fallback initials",
  component: ({ props }) => {
    const src = props.image as string | undefined;
    return src ? (
      <MuiAvatar src={src} alt={props.name as string} />
    ) : (
      <MuiAvatar>{getInitials(props.name as string)}</MuiAvatar>
    );
  },
});
