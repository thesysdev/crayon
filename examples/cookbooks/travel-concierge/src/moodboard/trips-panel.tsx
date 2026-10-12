"use client";

import { Button, IconButton } from "@openuidev/react-ui";
import { PanelLeftClose, PanelLeftOpen, Plane, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import MoodboardStudio from "./studio";
import { trips, useTrips, type Trip } from "./trips";
import "./trips.css";

// The moodboard with a floating Trips panel on the left. Each trip mounts its own studio, so
// switching trips swaps the board, the planner conversation, and any open question at once.

// A /design/moodboard?trip=... link plans in a fresh trip, not on top of the open one.
if (typeof window !== "undefined" && new URL(window.location.href).searchParams.get("trip")?.trim())
  trips.create();

const ago = (time: number) => {
  const minutes = Math.round((Date.now() - time) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function TripRow({ trip, active, locked }: { trip: Trip; active: boolean; locked: boolean }) {
  return (
    <li>
      <button
        type="button"
        className={`mb-trip${active ? " is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        disabled={locked && !active}
        title={locked && !active ? "Wait for this board to finish" : undefined}
        onClick={() => trips.select(trip.id)}
      >
        <span className="mb-trip__cover">
          {trip.photo || trip.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trip.photo ?? trip.cover} alt="" draggable={false} />
          ) : (
            <Plane size={16} />
          )}
        </span>
        <span className="mb-trip__text">
          <span className="mb-trip__name">{trip.place ?? trip.name}</span>
          <span className="mb-trip__meta">
            {trip.location ?? (trip.pieces ? ago(trip.updated) : "Empty canvas")}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function TripsStudio() {
  const { active, trips: list } = useTrips();
  const [open, setOpen] = useState(true);
  // A board that's still being written can't be left until it's done.
  const [busy, setBusy] = useState(false);
  // Re-render now and then so "5m ago" stays true.
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const panel = open ? (
    <aside className="mb-trips" aria-label="Trips">
      <header className="mb-trips__head">
        <h2>Trips</h2>
        <IconButton
          icon={<PanelLeftClose size={15} />}
          variant="tertiary"
          shape="circle"
          size="small"
          title="Hide trips"
          onClick={() => setOpen(false)}
        />
      </header>
      <Button
        className="mb-trips__new"
        variant="primary"
        size="medium"
        iconLeft={<Plus size={16} />}
        disabled={busy}
        onClick={() => trips.create()}
      >
        New trip
      </Button>
      <ul className="mb-trips__list">
        {list.map((trip) => (
          <TripRow key={trip.id} trip={trip} active={trip.id === active} locked={busy} />
        ))}
      </ul>
    </aside>
  ) : (
    <button
      type="button"
      className="mb-trips-toggle"
      title="Show trips"
      onClick={() => setOpen(true)}
    >
      <PanelLeftOpen size={15} />
      <span>Trips</span>
      <span className="mb-trips-toggle__count">{list.length}</span>
    </button>
  );

  // The panel renders inside the studio, under its theme and type.
  return <MoodboardStudio key={active} trip={active} onBusy={setBusy} aside={panel} />;
}
