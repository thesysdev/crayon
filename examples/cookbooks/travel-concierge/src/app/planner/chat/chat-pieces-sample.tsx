"use client";

import { useState } from "react";
import { handFont } from "../../horizontal-journal/fonts";
import { ItineraryProvider } from "../itinerary";
import { ChatAnswer } from "./chat";

// The chat's Dates and Explore-style pieces for /components, live: each sample is the OpenUI Lang
// the chat agent writes, rendered by the chat library. Taps work; the message a tap would send
// shows under the sample instead of going to the agent. Hearts save to a sample trip of their own.

const SAMPLE = "components-chat-sample";

const month = (offset: number, day: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const samples = {
  question: `root = Chat([p, q])
p = Pull("Slow mornings [Hammock], warm water [Lagoon] and nowhere to be.", "let's find yours")
q = Question("What kind of slow are you after?", [Option("Somewhere by the sea", "beach", "landscape"), Option("Up in the hills", "hills", "landscape"), Option("A quiet old town", "village", "landscape"), Option("Cheap and cheerful", null, "budget")], "Just show me ideas")`,
  dates: `root = Chat([p, d], "Kyoto")
p = Pull("Kyoto turns on a week, so let's pin down when you're going.")
d = Dates("When are you going?", [w1, w2, w3, w4], 4)
w1 = When("Autumn leaves", "${month(1, 13)}", "${month(1, 17)}", "maples at their reddest")
w2 = When("Early winter", "${month(2, 4)}", "${month(2, 8)}", "cool, dry, quiet temples")
w3 = When("New Year", "${month(2, 29)}", "${month(3, 2)}", "temple bells at midnight")
w4 = When("Plum blossom", "${month(4, 19)}", "${month(4, 23)}", "first flowers, fewer crowds")`,
  route: `root = Chat([p, r])
p = Pull("Two weeks, three cities, and every leg is a _fast train_.")
r = Route("Italy by train", [Stop("Rome", "Rome", "1h 30 by fast train"), Stop("Florence", "Florence", "2h 10 to the lagoon"), Stop("Venice", "Venice")])`,
  picks: `root = Chat([p, k])
p = Pull("Slow, warm and green: here's where I'd start looking.")
k = Picks("Places to _slow down_", [Pick("Ubud", "Ubud", "rice terraces, yoga"), Pick("Hoi An", "Hội An", "lanterns and tailors"), Pick("Goa", "Goa", "beach shacks at sunset"), Pick("Siargao", "Siargao", "surf, then nothing")])`,
  dishes: `root = Chat([p, d])
p = Pull("Lisbon eats standing up, and it eats well for very little.")
d = Dishes("Three things to _eat first_", [Dish("Pastel de nata", "Pastel de nata", "1.40 €", true), Dish("Bifana", "Bifana", "3.50 €"), Dish("Ginjinha", "Ginjinha", "1.50 €")], "the tart, still warm")`,
  versus: `root = Chat([p, v])
p = Pull("Both are islands, but they're not the same holiday at all.")
v = Versus(Side("Santorini", "Santorini"), Side("Naxos", "Naxos"), "naxos, if you want beaches over views")`,
  price: `root = Chat([p, x])
p = Pull("Hanoi is the cheapest great meal you'll ever have.")
x = Price("40k ₫", "A bowl of phở bò on a plastic stool", "Phở", "about a dollar fifty")`,
  checklist: `root = Chat([p, c])
p = Pull("Do Istanbul in this order and you'll beat every crowd.")
c = Checklist("Istanbul, ==in order==", [Item("Hagia Sophia at opening", "Hagia Sophia", true, "8:30 sharp"), Item("Basilica Cistern", "Basilica Cistern"), Item("Lunch in the Grand Bazaar", "Grand Bazaar", false, "haggle a little"), Item("Ferry to Kadıköy", "Kadıköy", false, "sunset side")])`,
};

export type ChatPieceId = keyof typeof samples;

/** One piece, as the chat shows it, with what a tap would send. */
export function ChatPieceSample({ id }: { id: ChatPieceId }) {
  const [sent, setSent] = useState("");
  const live = id === "dates" || id === "picks" || id === "question";
  return (
    <ItineraryProvider trip={SAMPLE}>
      <div className={`pl-chat-sample ${handFont.variable}`} style={{ width: "min(880px, 100%)", margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <ChatAnswer code={samples[id]} turn={`sample-${id}`} send={live ? setSent : undefined} />
        {live ? <p className="pl-steps-sample__sent">{sent ? `Sends: “${sent}”` : "Tap to see the message it sends."}</p> : null}
      </div>
    </ItineraryProvider>
  );
}

/** A Dates reply once answered: the window that was picked, the rest stepped back. */
export function ChatDatesAnsweredSample() {
  const from = month(1, 13);
  const d = new Date(`${from}T12:00:00`);
  const answer = `Plan it for 4 nights, ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "long" })} to ${d.getDate() + 4} ${d.toLocaleDateString("en-GB", { month: "long" })} ${d.getFullYear()}`;
  return (
    <ItineraryProvider trip={SAMPLE}>
      <div className={`pl-chat-sample ${handFont.variable}`} style={{ width: "min(880px, 100%)", margin: "0 auto" }}>
        <ChatAnswer code={samples.dates} turn="sample-dates-answered" answer={answer} />
      </div>
    </ItineraryProvider>
  );
}
