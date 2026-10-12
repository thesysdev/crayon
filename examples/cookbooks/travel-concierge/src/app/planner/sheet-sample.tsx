"use client";

import { Renderer } from "@openuidev/react-lang";
import { X } from "lucide-react";
import { useState } from "react";
import { sheetLibrary, StackOpener } from "./sheet";

// The stacked detail sheet for /components: a Lisbon sheet whose Nearby places each open their
// own sheet on top, the same OpenUI Lang the sheet route writes, fixed here so the stage never
// calls the agent.

const sheets: Record<string, string> = {
  Alfama: `root = Sheet("Alfama", "Lisbon's oldest quarter, Portugal", ["Alfama", "Lisbon Cathedral", "São Jorge Castle", "Fado", "Feira da Ladra"], [h1, h2, h3], "Alfama is the Lisbon that survived the 1755 earthquake: steep lanes, laundry over the stairs and tram 28 squeezing past the doorways. Come in the late afternoon when the light turns gold, climb to a miradouro, then stay for fado in a small tasca after dark.", [s1], ["Wear shoes with grip, the cobbles are slick", "Tram 28 is busiest from 10am to 4pm", "Fado houses fill by 9pm, book a table"], [], "get lost on purpose")
h1 = Highlight("Lanes older than the earthquake", "The street plan is medieval, laid down when it was the Moorish town.")
h2 = Highlight("Views from every corner", "Santa Luzia and Portas do Sol look over the river and the roofs.")
h3 = Highlight("Fado where it was born", "Small rooms, candles, and singers a few feet away.")
s1 = Section("Nearby", [t1, t2, t3])
t1 = Thing("The castle", "São Jorge Castle", "walls and peacocks above the city")
t2 = Thing("The cathedral", "Lisbon Cathedral", "Romanesque, older than the country's borders")
t3 = Thing("Feira da Ladra", "Feira da Ladra", "the flea market, Tuesdays and Saturdays")`,
  "São Jorge Castle": `root = Sheet("São Jorge Castle", "A Moorish castle on Lisbon's highest hill", ["São Jorge Castle", "Alfama", "Miradouro de Santa Luzia", "Tagus", "Lisbon Cathedral"], [h1, h2, h3], "The castle crowns the hill over Alfama, its walls rebuilt but its views unchanged. Walk the ramparts at opening time before the tour groups, then sit under the pines with the peacocks and watch the river.", [s1], ["Opens at 9am, go first thing", "The walk up is steep, tram 28 or bus 737 saves your legs"], [], "best view in lisbon")
h1 = Highlight("Ramparts you can walk", "Eleven towers, and a path along the top of the walls.")
h2 = Highlight("The whole city below", "From the terrace you see the Baixa grid, the river and the bridge.")
h3 = Highlight("Peacocks under the pines", "They roam the gardens and nobody minds.")
s1 = Section("Nearby", [t1, t2])
t1 = Thing("Santa Luzia", "Miradouro de Santa Luzia", "tiles and bougainvillea")
t2 = Thing("The cathedral", "Lisbon Cathedral", "ten minutes downhill")`,
  "Lisbon Cathedral": `root = Sheet("Lisbon Cathedral", "The Sé, Lisbon's oldest church", ["Lisbon Cathedral", "Alfama", "São Jorge Castle", "Tram 28", "Fado"], [h1, h2, h3], "Built in 1147 on the site of a mosque, the Sé looks more fortress than church. Step inside for the rose window and the cloister ruins, then catch tram 28 as it rattles past the door.", [s1], ["The cloister has a small fee", "Tram 28 stops right outside"], [], "go for the cloister")
h1 = Highlight("Fortress front", "Two crenellated towers from the Reconquista.")
h2 = Highlight("A rose window", "Light pours in over the nave in the afternoon.")
h3 = Highlight("Roman streets underneath", "The cloister dig shows layers back to the Romans.")
s1 = Section("Nearby", [t1])
t1 = Thing("The castle", "São Jorge Castle", "up the hill")`,
  "Feira da Ladra": `root = Sheet("Feira da Ladra", "Lisbon's flea market, Campo de Santa Clara", ["Feira da Ladra", "Alfama", "National Pantheon (Portugal)", "Azulejo", "Lisbon Cathedral"], [h1, h2, h3], "Twice a week the square behind São Vicente fills with tiles, records, old keys and junk. Come early on Saturday for the best stalls, and bargain with a smile.", [s1], ["Tuesdays and Saturdays, morning to early afternoon", "Bring cash"], [], "haggle a little")
h1 = Highlight("Old tiles by the box", "Loose azulejos from demolished buildings.")
h2 = Highlight("Since the Middle Ages", "A market has run in Lisbon under this name for centuries.")
h3 = Highlight("The Pantheon next door", "Its white dome watches over the stalls.")
s1 = Section("Nearby", [t1])
t1 = Thing("The castle", "São Jorge Castle", "a short climb away")`,
};

export function StackedSheetSample() {
  const [stack, setStack] = useState<string[]>(["Alfama"]);
  return (
    <div className="pl-sheet-stack">
      {stack.map((subject, i) => (
        <div key={`${i}:${subject}`} className="hj-sheet-layer" style={{ ["--depth" as string]: stack.length - 1 - i }} inert={i < stack.length - 1}>
          <div className="hj-sheet-panel" role="dialog" aria-label={subject}>
            {i > 0 ? (
              <button type="button" className="hj-sheet-close" onClick={() => setStack((list) => list.slice(0, i))} aria-label="Close">
                <X size={26} strokeWidth={1.5} />
              </button>
            ) : null}
            <StackOpener.Provider
              value={(next) => setStack((list) => (sheets[next.subject] ? [...list.slice(0, i + 1), next.subject] : list))}
            >
              <Renderer response={sheets[subject]} library={sheetLibrary} isStreaming={false} />
            </StackOpener.Provider>
          </div>
        </div>
      ))}
    </div>
  );
}
