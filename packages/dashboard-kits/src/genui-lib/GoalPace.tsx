"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { GoalPace as GoalPaceView } from "../components/Charts/GoalPace";
import { goalSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const GoalPace = defineComponent({
  name: "GoalPace",
  description:
    "Progress toward a goal for a calendar period, like a monthly sales target: a gauge of the share reached with a tick where the pace says it should be, whether the period is on pace and where it is projected to finish, and the running total against the straight-line pace to the goal. Pass a goal tool's result directly: GoalPace(goal).",
  props: z.object({
    goal: goalSchema,
  }),
  component: ({ props }) => {
    const goal = props.goal;
    if (!goal || goal.labels.length === 0 || goal.cumulative.length === 0 || !(goal.goal > 0)) {
      return <Pending kind="hero" />;
    }
    return <GoalPaceView goal={goal} />;
  },
});
