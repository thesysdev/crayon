"use client";

import { useEffect, useState, type ReactNode } from "react";

export type GalleryItem = { id: string; name: string; view: ReactNode };
export type GalleryGroup = { title: string; items: GalleryItem[] };

// The F1 gallery structure (grouped items, one shown at a time) in the timeless.co playground's
// shape: the item fills a white stage and the grouped list sits in a grey panel on the right.
// Views are rendered on the server and passed in; this only tracks which one is showing.
// The selection lives in the URL hash so links like /components#ramps open that item.
export function Gallery({ groups }: { groups: GalleryGroup[] }) {
  const all = groups.flatMap((g) => g.items);
  const [selectedId, setSelectedId] = useState(all[0].id);

  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.slice(1);
      if (all.some((i) => i.id === id)) setSelectedId(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
    // `all` is rebuilt every render but its ids never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: string) => {
    setSelectedId(id);
    history.replaceState(null, "", `#${id}`);
    document.querySelector(".ds-gallery__stage")?.scrollTo({ top: 0 });
  };

  const selected = all.find((i) => i.id === selectedId) ?? all[0];

  return (
    <div className="ds-gallery">
      <main className="ds-gallery__stage" aria-label={selected.name}>
        {selected.view}
      </main>
      <nav className="ds-gallery__panel" aria-label="Design system">
        <header className="ds-gallery__header">Travel planner</header>
        {groups.map((g, i) => (
          <section key={g.title} className="ds-gallery__group">
            <h1 className="ds-gallery__group-title">
              <span>{i + 1}</span>
              {g.title}
            </h1>
            <div className="ds-gallery__items">
              {g.items.map((item) => (
                <button
                  key={item.id}
                  className={item.id === selected.id ? "active" : undefined}
                  aria-current={item.id === selected.id ? "page" : undefined}
                  onClick={() => select(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </div>
  );
}
