"use client";

import { DrawablyCircle, DrawablyHighlight, DrawablyUnderline } from "./drawably/react.js";
import { Note, Photo, amber, canvas, cobalt, commons, coral, coralText, hand, ink, serif, ui } from "./kit";
import { MoreSpreads } from "./more";

const img = {
  alfama: commons("Lisbon_alfalma.jpg"),
  nata: commons("Pasteis_de_Belem.jpg", 900),
  positano: commons("Positano_Sunset.JPG"),
  oia: commons("Oia_sunset_-_panoramio_(2).jpg"),
  manarola: commons("Manarola_NW_Cinque_Terre_Sep23_A7C_07233.jpg"),
  pizza: commons("Neapolitan_pizza_at_Trappica_(48701940197).jpg", 1000),
  gelato: commons("Delicious_Gelato_on_display.jpg", 1000),
  spritz: commons("Aperol_Spritz_aboard_Viking_Mariella.jpg", 1000),
  torii: commons("Torii_path_with_lantern_at_Fushimi_Inari_Taisha_Shrine,_Kyoto,_Japan.jpg"),
  ramen: commons("Shoyu_Ramen（Tokyo_Ramen）_-_01.jpg", 1000),
  square: commons("Djemaa_el_Fna.jpg"),
  tajine: commons("Tajine-marocain-un-plat-varie-et-sain_(cropped).jpg", 900),
  chefchaouen: commons("Chefchaouen-the-blue-city-of-morocco-with-palm-trees-and-the-mountain-view-in-the-backrgound.jpg", 1200),
};

/* ---------- 01 Cover: one huge photo, giant serif, scrawled directions ---------- */

function Cover() {
  return (
    <section>
      <div style={{ position: "relative" }}>
        <Photo src={img.alfama} alt="Rooftops of Alfama, Lisbon" ratio="16 / 8">
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
          <h2 style={serif(260, { position: "absolute", left: 40, bottom: 28, color: "#fff", fontSize: "clamp(120px, 18vw, 280px)" })}>Lisbon</h2>
          <Note arrow="swoop" dir="down-left" color="#fff" size={40} rotate={-5} arrowSize={140} style={{ position: "absolute", right: "8%", top: "8%" }}>
            climb up here
            <br />
            for sunset
          </Note>
        </Photo>

        <div style={{ position: "absolute", right: 48, bottom: -70, width: 240, transform: "rotate(4deg)", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", border: "8px solid #fff" }}>
          <Photo src={img.nata} alt="Pastéis de Belém" ratio="1 / 1" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 48, alignItems: "flex-start", padding: "36px 0 0 40px", maxWidth: "62%" }}>
        <p style={serif(28, { lineHeight: 1.2, letterSpacing: "-0.01em" })}>
          Three days of steep streets, tiled walls and custard tarts still warm from the oven.
        </p>
        <span style={hand(32, coralText, -2, { whiteSpace: "nowrap", marginTop: 8 })}>
          get <DrawablyCircle stroke={coralText} seed={4}>six</DrawablyCircle>, not two
        </span>
      </div>
    </section>
  );
}

/* ---------- 02 Menu grid: tight food grid, serif captions, pen verdicts ---------- */

function MenuGrid() {
  const items = [
    { src: img.pizza, alt: "Neapolitan pizza", title: "Marinara", price: "6 €" },
    { src: img.gelato, alt: "Gelato in a display case", title: "Pistachio", price: "3 €" },
    { src: img.spritz, alt: "Aperol spritz", title: "Spritz", price: "9 €", note: "half the price one street back" },
  ];
  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 3fr", gap: 8 }}>
        <div style={{ background: coral, color: "#fff", padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h2 style={serif(84, { color: "#fff" })}>What to eat in Naples</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <Note arrow="line" dir="right" color="#fff" size={34} rotate={-4} arrowSize={90}>
              the only pizza
              <br />
              that matters
            </Note>
            <span style={hand(26, "#fff", 3, { opacity: 0.9 })}>
              skip the bar on the
              <br />
              piazza, go one street back
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {items.map((it) => (
            <div key={it.title}>
              <Photo src={it.src} alt={it.alt} ratio="3 / 4">
                
              </Photo>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 2px 0" }}>
                <span style={serif(40)}>{it.title}</span>
                {it.note ? (
                  <DrawablyCircle stroke={coralText} width={2} seed={17}>
                    <span style={serif(22)}>{it.price}</span>
                  </DrawablyCircle>
                ) : (
                  <span style={serif(22)}>{it.price}</span>
                )}
              </div>
              {it.note ? <span style={hand(26, coralText, -2, { marginTop: 6 })}>{it.note}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 03 Itinerary: tall photo, serif timetable, margin notes ---------- */

function Itinerary() {
  const rows = [
    ["06:30", "Fushimi Inari, before the tour buses"],
    ["10:00", "Coffee and a long walk down to Gion"],
    ["13:00", "Shoyu ramen at the counter"],
    ["19:30", "Pontocho alley, dinner by the river"],
  ];
  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "5fr 6fr", gap: 56, alignItems: "stretch" }}>
        <Photo src={img.torii} alt="Torii gates at Fushimi Inari, Kyoto" ratio="4 / 5">
          <span style={{ ...ui, position: "absolute", left: 20, top: 20, color: "#fff" }}>Day 2 · Kyoto</span>
        </Photo>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 8 }}>
          <h2 style={serif(112)}>
            A slow day in <DrawablyUnderline stroke={coral} width={3} seed={5}>Kyoto</DrawablyUnderline>
          </h2>
          <div style={{ position: "relative", margin: "24px 0" }}>
            <span style={hand(34, coralText, -5, { position: "absolute", right: 0, top: -58 })}>
              seriously, go early
            </span>
            {rows.map(([t, what]) => (
              <div key={t} style={{ display: "grid", gridTemplateColumns: "110px 1fr", borderTop: `1px solid ${ink}`, padding: "16px 0" }}>
                <span style={serif(26, { fontVariantNumeric: "tabular-nums" })}>{t}</span>
                <span style={serif(26, { lineHeight: 1.15 })}>{what}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr", gap: 16, alignItems: "end" }}>
            <Note arrow="squiggle" dir="right" size={30} arrowSize={90} style={{ paddingLeft: 12 }}>
              slurping is
              <br />
              <DrawablyHighlight fill={amber} seed={9}>polite</DrawablyHighlight> here
            </Note>
            <Photo src={img.ramen} alt="Shoyu ramen" ratio="4 / 3">
            </Photo>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 04 Poster: colour block, one loud line, photos as stickers ---------- */

function Poster() {
  return (
    <section>
      <div style={{ position: "relative", background: cobalt, color: "#fff", padding: "56px 48px 72px", overflow: "visible" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40 }}>
          <div>
            <h2 style={serif(150, { color: "#fff" })}>
              Eat
              <br />
              everything.
            </h2>
            <p style={serif(28, { color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: 520, marginTop: 28 })}>
              Marrakech after dark: smoke from a hundred grills, orange juice at 4 dirhams, and a tagine that took all afternoon.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 36, paddingRight: 24 }}>
              <Note arrow="loop" dir="up-right" color={amber} size={38} rotate={-4} arrowSize={130}>
                the square
                <br />
                at dusk
              </Note>
            </div>
          </div>
          <div style={{ position: "relative", minHeight: 640 }}>
            <div style={{ position: "absolute", right: 0, top: -90, width: "88%", transform: "rotate(3deg)", border: "10px solid #fff" }}>
              <Photo src={img.square} alt="Jemaa el-Fnaa square, Marrakech" ratio="4 / 3">
              </Photo>
            </div>
            <div style={{ position: "absolute", left: -10, top: 250, width: "52%", transform: "rotate(-5deg)", border: "10px solid #fff" }}>
              <Photo src={img.tajine} alt="Moroccan tajine" ratio="1 / 1" />
            </div>
            <div style={{ position: "absolute", right: -20, top: 330, width: "44%", transform: "rotate(6deg)", border: "10px solid #fff" }}>
              <Photo src={img.chefchaouen} alt="Chefchaouen, the blue town" ratio="3 / 4">
              </Photo>
            </div>
            <span style={hand(30, "#fff", -3, { position: "absolute", left: 10, top: 540 })}>
              day trip:
              <br />
              the blue town
              <br />
              (<DrawablyUnderline stroke={amber} seed={8}>3 hrs</DrawablyUnderline> by bus)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 05 Choose: three postcards, a pen question, arrows to each ---------- */

function Choose() {
  const cards = [
    { src: img.positano, alt: "Positano at sunset", name: "Positano", sub: "Amalfi Coast", rot: -3 },
    { src: img.oia, alt: "Oia at sunset", name: "Oia", sub: "Santorini", rot: 2 },
    { src: img.manarola, alt: "Manarola, Cinque Terre", name: "Manarola", sub: "Cinque Terre", rot: -1.5 },
  ];
  return (
    <section>
      <div style={{ textAlign: "center", padding: "8px 0 40px" }}>
        <h2 style={serif(110)}>Three coasts, one week</h2>
        <Note arrow="bounce" dir="down" color={coralText} size={40} rotate={-2} arrowSize={110} style={{ marginTop: 22 }}>
          which one?? (I vote <DrawablyUnderline stroke={coralText} width={2.5} seed={3}>Oia</DrawablyUnderline>)
        </Note>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
        {cards.map((card) => (
          <div key={card.name} style={{ background: "#fff", padding: 14, transform: `rotate(${card.rot}deg)`, boxShadow: "0 18px 36px rgba(0,0,0,0.12)" }}>
            <Photo src={card.src} alt={card.alt} ratio="4 / 5">
            </Photo>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 4px 4px" }}>
              <span style={serif(44)}>{card.name}</span>
              <span style={{ ...ui, color: "#5f6369" }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Pairings() {
  return (
    <main style={{ background: canvas, color: ink, minHeight: "100vh", padding: "56px 48px 140px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 160 }}>
        <Cover />
        <MenuGrid />
        <Itinerary />
        <Poster />
        <Choose />
        <MoreSpreads />
      </div>
    </main>
  );
}
