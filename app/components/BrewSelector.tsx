"use client";

import { useState } from "react";

type Brew = "espresso" | "pour-over" | "french-press";

const recipes: Record<Brew, { ratio: string; grind: string; temp: string; time: string; note: string }> = {
  espresso: { ratio: "1:2", grind: "Fine", temp: "93 °C", time: "28–32 s", note: "18 g in, 36 g out. The Kindred house recipe." },
  "pour-over": { ratio: "1:16", grind: "Medium-fine", temp: "96 °C", time: "3:00–3:30", note: "25 g in, 400 g out. Bloom 30 s, then pulse." },
  "french-press": { ratio: "1:15", grind: "Coarse", temp: "94 °C", time: "4:00", note: "30 g in, 450 g out. Steep, then press gently." },
};

export function BrewSelector() {
  const [brew, setBrew] = useState<Brew>("espresso");
  const r = recipes[brew];
  return (
    <div className="brew-selector" role="group" aria-label="Brew method">
      <div className="brew-tabs">
        {(Object.keys(recipes) as Brew[]).map((b) => (
          <button
            key={b}
            type="button"
            className={`brew-tab ${brew === b ? "active" : ""}`}
            onClick={() => setBrew(b)}
            aria-pressed={brew === b}
          >
            {b === "pour-over" ? "Pour-over" : b === "french-press" ? "French press" : "Espresso"}
          </button>
        ))}
      </div>
      <div className="brew-card">
        <div className="brew-row"><span>Ratio</span><strong>{r.ratio}</strong></div>
        <div className="brew-row"><span>Grind</span><strong>{r.grind}</strong></div>
        <div className="brew-row"><span>Temp</span><strong>{r.temp}</strong></div>
        <div className="brew-row"><span>Time</span><strong>{r.time}</strong></div>
        <p className="brew-note">{r.note}</p>
      </div>
    </div>
  );
}
