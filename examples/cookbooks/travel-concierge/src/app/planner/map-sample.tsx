"use client";

import { handFont } from "../horizontal-journal/fonts";
import { LocationLine, MapSpread, MiniMap, useGeocode } from "./map";
import "./scroll-sample.css";

// The maps in /components, with live lookups: a day in Alfama, the location line, the mini map.

const alfama = ["Miradouro de Santa Luzia", "Lisbon Cathedral", "Castelo de São Jorge", "Feira da Ladra", "National Pantheon"];

export function MapSample() {
  return (
    <div className={`pl-steps-sample ${handFont.variable}`}>
      <div className="pl-scroll-sample" style={{ aspectRatio: "auto" }}>
        <div className="pl-scroll-sample__strip" style={{ height: 560 }}>
          <div className="hj-frame pl-scroll-sample__panel" style={{ flexBasis: "100%" }}>
            <MapSpread title="A slow day in Alfama" places={alfama} near="Lisbon" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LocationSample() {
  const points = useGeocode(["Time Out Market Lisboa", "Belém Tower", "Alfama"], "Lisbon");
  const [market, tower, stay] = ["Time Out Market Lisboa", "Belém Tower", "Alfama"].map((n) => points?.find((p) => p.name === n));
  return (
    <div className="pl-sample-box" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <LocationLine point={market} from={stay} fromLabel="your stay in Alfama" />
      <LocationLine point={tower} from={stay} fromLabel="your stay in Alfama" />
      <LocationLine point={stay} />
    </div>
  );
}

export function MiniMapSample() {
  return (
    <div className="pl-sample-box" style={{ maxWidth: 380 }}>
      <MiniMap name="Time Out Market Lisboa" near="Lisbon" stay="Alfama" heading="Where it is" />
    </div>
  );
}
