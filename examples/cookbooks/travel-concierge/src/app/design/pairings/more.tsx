"use client";

import { Fragment, type CSSProperties } from "react";
import { DrawablyCircle, DrawablyHighlight, DrawablyUnderline } from "./drawably/react.js";
import { HandArrow, Note, Photo, amber, blue, cobalt, commons, coral, coralText, emerald, hand, ink, magenta, serif, ui, type ArrowDir, type ArrowStyle } from "./kit";

// Twenty more spreads built from ten reusable compositions. Photos are Wikimedia Commons files.
// Arrows are optional and belong to their note: a spread only says which way the note points.

type Pointer = { arrow: ArrowStyle; dir: ArrowDir };

/* ---------- Bleed: full photo, giant title, a pen note on the picture ---------- */

function Bleed({ file, alt, title, note, noteAt, pointer, ratio = "16 / 8", titleTop = false, accent = "#fff" }: {
  file: string; alt: string; title: string; note: string; noteAt: CSSProperties; pointer?: Pointer; ratio?: string; titleTop?: boolean; accent?: string;
}) {
  return (
    <section>
      <Photo src={commons(file)} alt={alt} ratio={ratio}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${titleTop ? "0deg" : "180deg"}, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)` }} />
        <h2 style={serif(240, { position: "absolute", left: 40, [titleTop ? "top" : "bottom"]: 28, color: "#fff", fontSize: "clamp(110px, 16vw, 250px)" })}>{title}</h2>
        <Note arrow={pointer?.arrow} dir={pointer?.dir} color={accent} size={40} rotate={-4} arrowSize={130} style={{ position: "absolute", textShadow: "0 2px 12px rgba(0,0,0,0.3)", ...noteAt }}>
          {note}
        </Note>
      </Photo>
    </section>
  );
}

/* ---------- Split: colour block with the words, photo with the evidence ---------- */

function Split({ file, alt, color, title, body, note, pointer, reverse = false, noteColor = "#fff" }: {
  file: string; alt: string; color: string; title: string; body: string; note: string; pointer?: Pointer; reverse?: boolean; noteColor?: string;
}) {
  const block = (
    <div style={{ background: color, color: "#fff", padding: "44px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32 }}>
      <h2 style={serif(104, { color: "#fff" })}>{title}</h2>
      <p style={serif(26, { color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: 440 })}>{body}</p>
      <Note arrow={pointer?.arrow} dir={pointer?.dir} color={noteColor} size={40} rotate={-4} style={{ alignSelf: reverse ? "flex-start" : "flex-end" }}>
        {note}
      </Note>
    </div>
  );
  const photo = <Photo src={commons(file)} alt={alt} ratio="5 / 6" />;
  return (
    <section style={{ display: "grid", gridTemplateColumns: reverse ? "1.2fr 1fr" : "1fr 1.2fr", gap: 8 }}>
      {reverse ? photo : block}
      {reverse ? block : photo}
    </section>
  );
}

/* ---------- Trio: headline over three tight photos, a verdict in the corner ---------- */

function Trio({ title, items, verdict, pointer, circle, color = coralText }: {
  title: string; items: { file: string; name: string; price: string }[]; verdict: string; pointer?: Pointer; circle: number; color?: string;
}) {
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <h2 style={serif(120)}>{title}</h2>
        <Note arrow={pointer?.arrow} dir={pointer?.dir} color={color} size={38} rotate={-5} arrowSize={90} style={{ marginRight: 24, whiteSpace: "nowrap" }}>
          {verdict}
        </Note>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {items.map((it, i) => (
          <div key={it.name}>
            <Photo src={commons(it.file, 1000)} alt={it.name} ratio="4 / 5" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 2px 0" }}>
              <span style={serif(38)}>{it.name}</span>
              {i === circle ? (
                <DrawablyCircle stroke={color} width={2}>
                  <span style={serif(22)}>{it.price}</span>
                </DrawablyCircle>
              ) : (
                <span style={serif(22)}>{it.price}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Inline: one giant sentence with photos set into the line like words ---------- */

type Part = string | { file: string; alt: string; w?: number };

function Inline({ parts, note, color = coralText, underline }: { parts: Part[]; note: string; color?: string; underline?: string }) {
  return (
    <section style={{ padding: "24px 0" }}>
      <h2 style={serif(132, { lineHeight: 1.08, maxWidth: 1300 })}>
        {parts.map((part, i) => {
          if (typeof part === "string") {
            if (underline && part.includes(underline)) {
              const [a, b] = part.split(underline);
              return (
                <Fragment key={i}>
                  {a}
                  <DrawablyUnderline stroke={color} width={3}>{underline}</DrawablyUnderline>
                  {b}
                </Fragment>
              );
            }
            return <Fragment key={i}>{part}</Fragment>;
          }
          return (
            <span key={i} style={{ display: "inline-block", verticalAlign: "-0.08em", width: `${part.w ?? 1.6}em`, height: "0.82em", borderRadius: 999, overflow: "hidden", margin: "0 0.12em" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={commons(part.file, 700)} alt={part.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </span>
          );
        })}
      </h2>
      <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "12%", marginTop: 32 }}>
        <span style={hand(40, color, -3)}>{note}</span>
      </div>
    </section>
  );
}

/* ---------- Route: photos in a row, a pen arrow and travel time in each gap ---------- */

function Route({ title, stops, legs, arrow, color = ink, bg }: { title: string; stops: { file: string; name: string }[]; legs: string[]; arrow: ArrowStyle; color?: string; bg?: string }) {
  const fg = bg ? "#fff" : ink;
  return (
    <section style={{ background: bg, padding: bg ? "48px 40px 56px" : 0 }}>
      <h2 style={serif(120, { color: fg, marginBottom: 40 })}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 190px 1fr 190px 1fr", alignItems: "center" }}>
        {stops.map((s, i) => (
          <Fragment key={s.name}>
            <div>
              <Photo src={commons(s.file, 1000)} alt={s.name} ratio={i === 1 ? "3 / 4" : "4 / 5"} />
              <span style={serif(44, { color: fg, display: "block", marginTop: 14 })}>{s.name}</span>
            </div>
            {i < legs.length ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "0 8px" }}>
                <span style={hand(24, color, -4, { textAlign: "center" })}>{legs[i]}</span>
                <HandArrow style={arrow} dir="right" size={110} color={color} />
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

/* ---------- Quote: a big serif line beside a photo, a pen reply ---------- */

function Quote({ file, alt, quote, reply, pointer, color = coralText, photoLeft = false }: { file: string; alt: string; quote: string; reply: string; pointer?: Pointer; color?: string; photoLeft?: boolean }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: photoLeft ? "1fr 1.25fr" : "1.25fr 1fr", gap: 56, alignItems: "center" }}>
      <div style={{ order: photoLeft ? 2 : 1 }}>
        <p style={serif(88, { lineHeight: 1.02 })}>“{quote}”</p>
        <Note arrow={pointer?.arrow} dir={pointer?.dir} color={color} size={38} rotate={-3} arrowSize={120} style={{ marginTop: 36 }}>
          {reply}
        </Note>
      </div>
      <div style={{ order: photoLeft ? 1 : 2 }}>
        <Photo src={commons(file)} alt={alt} ratio="4 / 5" />
      </div>
    </section>
  );
}

/* ---------- Versus: two photos head to head, pen labels and a verdict ---------- */

function Versus({ a, b, title, verdict, pointer, color = ink }: { a: { file: string; label: string }; b: { file: string; label: string }; title: string; verdict: string; pointer?: Pointer; color?: string }) {
  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, position: "relative" }}>
        {[a, b].map((side, i) => (
          <Photo key={side.label} src={commons(side.file, 1200)} alt={side.label} ratio="1 / 1">
            <span style={hand(48, "#fff", i === 0 ? -5 : 4, { position: "absolute", left: 28, top: 24, textShadow: "0 2px 12px rgba(0,0,0,0.35)" })}>{side.label}</span>
          </Photo>
        ))}
        <h2 style={serif(140, { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", color: "#fff", background: ink, padding: "4px 28px 18px", whiteSpace: "nowrap" })}>{title}</h2>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <Note arrow={pointer?.arrow} dir={pointer?.dir} color={color} size={44} rotate={-2} arrowSize={100}>
          {verdict}
        </Note>
      </div>
    </section>
  );
}

/* ---------- Price: food photo with a huge serif price, circled and argued with ---------- */

function Price({ file, alt, price, item, place, note, color }: { file: string; alt: string; price: string; item: string; place: string; note: string; color: string }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", background: color }}>
      <Photo src={commons(file, 1400)} alt={alt} ratio="1 / 1" />
      <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#fff" }}>
        <span style={{ ...ui, color: "#fff", opacity: 0.85 }}>{place}</span>
        <div>
          <DrawablyCircle stroke="#fff" width={3}>
            <span style={serif(150, { color: "#fff", display: "inline-block", padding: "0 10px" })}>{price}</span>
          </DrawablyCircle>
          <p style={serif(52, { color: "#fff", marginTop: 24 })}>{item}</p>
        </div>
        <span style={hand(40, "#fff", -4)}>{note}</span>
      </div>
    </section>
  );
}

/* ---------- Checklist: serif list with thumbnails, pen ticks and asides ---------- */

function Checklist({ title, items, color = coralText }: { title: string; items: { file: string; text: string; done?: boolean; aside?: string }[]; color?: string }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64 }}>
      <h2 style={serif(132)}>{title}</h2>
      <div>
        {items.map((it, i) => (
          <div key={it.text} style={{ display: "grid", gridTemplateColumns: "56px 120px 1fr auto", gap: 24, alignItems: "center", borderTop: `1px solid ${ink}`, padding: "14px 0" }}>
            <span style={serif(28, { fontVariantNumeric: "tabular-nums" })}>{String(i + 1).padStart(2, "0")}</span>
            <Photo src={commons(it.file, 400)} alt={it.text} ratio="4 / 3" />
            <span style={serif(36, { lineHeight: 1.05 })}>
              {it.done ? <DrawablyHighlight fill={amber}>{it.text}</DrawablyHighlight> : it.text}
            </span>
            <span style={hand(30, color, -4, { whiteSpace: "nowrap" })}>{it.aside ?? (it.done ? "done!" : "")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Mosaic: asymmetric photo grid, title cut in, notes written on their tiles ---------- */

function Mosaic({ title, files, notes, block = ink }: { title: string; files: string[]; notes: { text: string; tile: number }[]; block?: string }) {
  const area = ["a", "b", "c", "d", "e"];
  return (
    <section style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gridTemplateRows: "320px 320px", gridTemplateAreas: '"a b c" "a d e"', gap: 8 }}>
        {files.map((f, i) => {
          const note = notes.find((n) => n.tile === i);
          return (
            <figure key={f} style={{ gridArea: area[i], margin: 0, position: "relative", overflow: "hidden", background: "#dcdfe2" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={commons(f, 1000)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {note ? <span style={hand(34, "#fff", -4, { position: "absolute", left: 20, bottom: 18, textShadow: "0 2px 12px rgba(0,0,0,0.45)" })}>{note.text}</span> : null}
            </figure>
          );
        })}
      </div>
      <h2 style={serif(92, { position: "absolute", left: -16, bottom: -40, background: block, color: "#fff", padding: "10px 28px 22px 32px", maxWidth: "40%" })}>{title}</h2>
    </section>
  );
}

/* ---------- the twenty ---------- */

export function MoreSpreads() {
  return (
    <>
      <Bleed file="Venezia_aerial_view.jpg" alt="Venice from the air" title="Venice" note="get lost on purpose" noteAt={{ right: "7%", top: "9%" }} />

      <Split file="Hallstatt_-_Zentrum_.JPG" alt="Hallstatt" color={cobalt} title="Hallstatt before 8am" body="The day-trippers arrive at ten. Take the first ferry, have the lake and the church spire to yourself." note="this view" pointer={{ arrow: "dash", dir: "right" }} />

      <Trio title="Snacks in Kyoto" verdict="the mochi stall by the shrine gate" pointer={{ arrow: "hook", dir: "down-left" }} circle={2} color={emerald}
        items={[{ file: "Sushi_platter.jpg", name: "Sushi", price: "¥1,800" }, { file: "Mochi_002.jpg", name: "Mochi", price: "¥300" }, { file: "Matcha_Scoop.jpg", name: "Matcha", price: "¥650" }]} />

      <Inline underline="standing up" note="this is the rule"
        parts={["Espresso ", { file: "Tazzina_di_caffè_a_Ventimiglia.jpg", alt: "espresso" }, " standing up, then cannoli ", { file: "Cannoli_siciliani_al_Caffè_Impero,_ad_Alcamo.jpg", alt: "cannoli", w: 2.2 }, " in Palermo."]} />

      <Route title="Italy by train" color={coralText} arrow="dash" legs={["1h 32m, fast train", "2h 05m, sit on the left"]}
        stops={[{ file: "Colosseo_2020.jpg", name: "Rome" }, { file: "Firenze_-_Piazzale_Michelangelo,_Firenze,_Italy_-_April_6,_2015_02.jpg", name: "Florence" }, { file: "Burano_Venice_17.jpg", name: "Venice" }]} />

      <Quote file="Machu_Picchu,_2023_(012).jpg" alt="Machu Picchu" quote="Worth every one of the sixteen hundred steps." reply="my legs disagree" pointer={{ arrow: "swoop", dir: "right" }} />

      <Versus title="Tokyo" verdict="two hours apart. do both." color={coralText}
        a={{ file: "Shibuya_Crossing,_Aerial.jpg", label: "the crossing" }} b={{ file: "View_of_Mount_Fuji_from_Ōwakudani_20211202.jpg", label: "the mountain" }} />

      <Price file="Bowl_of_Meatball_pho.jpg" alt="Bowl of pho" price="40k ₫" item="Phở bò, on a plastic stool" place="Hanoi · Old Quarter" note="best breakfast of the trip" color={coral} />

      <Checklist title="Istanbul, in order"
        items={[
          { file: "Hagia_Sophia_(228968325).jpeg", text: "Hagia Sophia at opening", done: true },
          { file: "Türk_Kahvesi_-_Bakir_Cezve.jpg", text: "Coffee, read the grounds", done: true },
          { file: "Baklava(1).png", text: "Baklava from Karaköy", aside: "buy two boxes" },
          { file: "Lula_kebab_2.jpg", text: "Kebab by the Bosphorus" },
          { file: "Cappadocia_balloon_trip,_Ortahisar_Castle_(11893715185).jpg", text: "Night bus to Cappadocia", aside: "book ahead!!" },
        ]} />

      <Mosaic title="Ten weeks south" block={magenta}
        files={["Tulum_2.jpg", "Tacos-al-Pastor.jpg", "Cebiche_de_corvina.JPG", "Arepitas_Food_Macro.jpg", "DJI_0197_crp_wiki.jpg"]}
        notes={[{ text: "tacos at 1am", tile: 1 }, { text: "Havana from a roof", tile: 4 }]} />

      <Bleed file="Al_Deir_Petra.JPG" alt="The Monastery at Petra" title="Petra" note="800 steps up. sunset." noteAt={{ right: "6%", bottom: "14%" }} accent={amber} ratio="16 / 9" />

      <Split reverse file="Plaza_de_España_(Sevilla)_-_01.jpg" alt="Plaza de España, Seville" color={magenta} title="Seville, slowly" body="Lunch at three, siesta till seven, churros at two in the morning. Nobody here is in a hurry." note="the tiles!" pointer={{ arrow: "hook", dir: "left" }} />

      <Trio title="Night market rules" verdict="one of each. no regrets." circle={1} color={coralText}
        items={[{ file: "Phat_Thai_kung_Chang_Khien_street_stall.jpg", name: "Pad thai", price: "60 ฿" }, { file: "Khao_Soi_Northern_Thai_food_ข้าวซอย_ผักดอง.jpg", name: "Khao soi", price: "50 ฿" }, { file: "Bánh_mì_thịt_nướng.png", name: "Bánh mì", price: "40 ฿" }]} />

      <Inline color={blue} note="the 6:40pm ferry" underline="the ferry"
        parts={["A lobster roll ", { file: "Lobster_Roll.png", alt: "lobster roll" }, " on the dock and the ferry ", { file: "Brooklyn_Bridge_and_the_Lower_Manhattan_skyline_from_Pebble_Beach,_New_York.jpg", alt: "Brooklyn Bridge", w: 2.6 }, " home."]} />

      <Route title="Tokyo to Kyoto" bg={ink} color={amber} arrow="swoop" legs={["Romancecar, 85 min", "Shinkansen, 2h"]}
        stops={[{ file: "Shibuya_Crossing,_Aerial.jpg", name: "Tokyo" }, { file: "View_of_Mount_Fuji_from_Ōwakudani_20211202.jpg", name: "Hakone" }, { file: "Torii_path_with_lantern_at_Fushimi_Inari_Taisha_Shrine,_Kyoto,_Japan.jpg", name: "Kyoto" }]} />

      <Quote photoLeft file="Moskenes_Reinebringen_lub_2025-07-21_img09_Aussicht.jpg" alt="Lofoten from Reinebringen" quote="In July the light never quite leaves." reply="slept three hours a night" color={blue} />

      <Versus title="or" verdict="both. obviously." pointer={{ arrow: "squiggle", dir: "up" }} color={magenta}
        a={{ file: "Croissant-Petr_Kratochvil.jpg", label: "sweet" }} b={{ file: "Croque_monsieur.jpg", label: "savoury" }} />

      <Price file={"\"Hyderabadi_Dum_Biryani\".jpg"} alt="Hyderabadi biryani" price="₹280" item="Dum biryani, eaten with your hands" place="Hyderabad · Charminar" note="ask for extra raita" color={emerald} />

      <Mosaic title="Small towns, loud colours" block={cobalt}
        files={["Burano_Venice_17.jpg", "Giethoorn_Netherlands_flckr05.jpg", "Sentiero_del_Viandante_DSC_6340_(14020554463).jpg", "The_walls_of_the_fortress_and_View_of_the_old_city._panorama.jpg", "Hallstatt_-_Zentrum_.JPG"]}
        notes={[{ text: "no cars at all", tile: 1 }, { text: "walk the walls at 8", tile: 3 }]} />

      <Bleed file="Cappadocia_balloon_trip,_Ortahisar_Castle_(11893715185).jpg" alt="Balloons over Cappadocia" title="Cappadocia" note="alarm at 4:30. worth it." pointer={{ arrow: "bounce", dir: "left" }} noteAt={{ right: "4%", top: "8%" }} ratio="16 / 9" />
    </>
  );
}
