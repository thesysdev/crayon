"use client";

import { Renderer } from "@openuidev/react-lang";
import { useEffect, useState } from "react";
import { handFont } from "../horizontal-journal/fonts";
import { journalLibrary } from "./library";
import { FollowUpCards, PlannerNext, type Stays } from "./home";
import { HotelSheet } from "./hotel-sheet";
import { ItineraryProvider } from "./itinerary";
import { Reply } from "./steps";
import "./scroll-sample.css";

// The guided-flow steps for /components, live: each is the OpenUI Lang the agent writes, in a
// panel the size the planner gives it. Taps work here too; the message they would send shows
// under the panel instead of going to the agent.

const samples: Record<string, { code: string; span: number }> = {
  question: {
    span: 8,
    code: `root = Journal([q])
q = Question("What's the budget, roughly?", [Option("Under $1,000", "keep it simple"), Option("$1,000 to $3,000", "comfy"), Option("Sky's the limit", "treat yourself")], "Just show me ideas", "emerald")`,
  },
  picks: {
    span: 10,
    code: `root = Journal([p])
p = Picks("Places to _slow down_", [Pick("Ubud", "Ubud", "rice terraces, yoga, quiet"), Pick("Hoi An", "Hội An", "lanterns and tailors"), Pick("Goa", "Goa", "beach shacks at sunset"), Pick("Siargao", "Siargao", "surf, then nothing")], "emerald")`,
  },
  dates: {
    span: 8,
    code: `root = Journal([d])
d = Dates("When are you going?", [w1, w2, w3, w4], 5, null, "coral")
w1 = When("Long weekend", "2026-11-20", "2026-11-23", "autumn leaves peak")
w2 = When("Early December", "2026-12-04", "2026-12-09", "cool, dry, quiet")
w3 = When("New Year", "2026-12-29", "2027-01-03", "temple bells at midnight")
w4 = When("Late January", "2027-01-22", "2027-01-27", "cheapest week of the year")`,
  },
};

export function StepSample({ id }: { id: keyof typeof samples }) {
  const { code, span } = samples[id];
  const [sent, setSent] = useState("");
  return (
    <div className={`pl-steps-sample ${handFont.variable}`}>
      <div className="pl-scroll-sample" style={{ aspectRatio: "auto" }}>
        <div className="pl-scroll-sample__strip" style={{ height: 560 }}>
          <div className="hj-frame pl-scroll-sample__panel" style={{ flexBasis: `${span * 7.5}%` }}>
            <Reply.Provider value={{ send: setSent }}>
              <Renderer response={code} library={journalLibrary} isStreaming={false} />
            </Reply.Provider>
          </div>
        </div>
      </div>
      <p className="pl-steps-sample__sent">{sent ? `Sends: “${sent}”` : "Tap to see the message it sends."}</p>
    </div>
  );
}

/** The closing "Where next?" page, with the agent's follow-ups as cards. */
export function FollowUpSample() {
  const [sent, setSent] = useState("");
  const stays = useSampleStays();
  const follow = [
    { label: "Create itinerary", kind: "schedule" },
    { label: "Find a quiet place to stay", kind: "stay" },
    { label: "What should I eat in Ubud?", kind: "food" },
    { label: "Add a day trip to the waterfalls", icon: "waterfall", kind: "landscape" },
    { label: "Then on to Singapore", icon: "singapore", kind: "place" },
  ];
  return (
    <div className={`pl-steps-sample ${handFont.variable}`}>
      <div className="pl-stage pl-stage--page">
        <PlannerNext onSend={setSent} suggestions={follow} stays={stays} />
      </div>
      <p className="pl-steps-sample__sent">{sent ? `Sends: “${sent}”` : "Tap a card to see the message it sends."}</p>
      <p className="pl-steps-sample__sent">Every kind of follow-up, with its icon. A kind whose icon isn&rsquo;t drawn yet shows its words.</p>
      <FollowUpCards items={kinds} onPick={setSent} />
    </div>
  );
}

const kinds = [
  { label: "place · Then on to Kyoto", icon: "kyoto", kind: "place" },
  { label: "landscape · Add a beach day", icon: "beach", kind: "landscape" },
  { label: "stay · Find a quiet place to stay", kind: "stay" },
  { label: "food · What should I eat?", kind: "food" },
  { label: "museum · Best museums nearby", kind: "museum" },
  { label: "schedule · Plan day two", kind: "schedule" },
  { label: "budget · Make it cheaper", kind: "budget" },
  { label: "dates · Pick dates", kind: "dates" },
  { label: "transport · How do I get around?", kind: "transport" },
  { label: "nightlife · Where to go out", kind: "nightlife" },
  { label: "market · Markets and shopping", kind: "market" },
  { label: "work · Cafés to work from", kind: "work" },
];

/** Live trivago hotels for the sample, from the planner's own sample search (two nights, a
 *  month from today), so the closing page shows real prices and booking links. */
function useSampleStays() {
  const [stays, setStays] = useState<Stays | null>(null);
  useEffect(() => {
    const day = (d: Date) => new Intl.DateTimeFormat("en-CA").format(d);
    const checkIn = new Date(Date.now() + 30 * 86_400_000);
    fetch(`/api/planner?stays=${encodeURIComponent("Alfama, Lisbon")}`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((text) => {
        const json = text.match(/\]\]>trivago:(.*)/)?.[1];
        if (!json) return;
        const hotels = Object.values(JSON.parse(json)) as Stays["hotels"];
        setStays({ title: "Stay in Alfama", checkIn: day(checkIn), checkOut: day(new Date(checkIn.getTime() + 2 * 86_400_000)), hotels });
      })
      .catch(() => {});
  }, []);
  return stays;
}

/** The hotel sheet, with a live trivago hotel (what clicking a hotel card opens). */
export function HotelSheetSample() {
  const stays = useSampleStays();
  const hotel = stays?.hotels[0];
  return (
    <ItineraryProvider trip="components-sample">
      <div className={`pl-sample-box ${handFont.variable}`} style={{ background: "#fff" }}>
        {hotel ? (
          <HotelSheet hotel={{ ...hotel, checkIn: stays.checkIn, checkOut: stays.checkOut }} />
        ) : (
          <p className="pl-steps-sample__sent">Finding a live hotel on trivago…</p>
        )}
      </div>
    </ItineraryProvider>
  );
}
