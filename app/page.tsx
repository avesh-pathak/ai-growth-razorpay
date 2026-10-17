import Image from "next/image";
import { Literata } from "next/font/google";
import { BrewSelector } from "./components/BrewSelector";

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-literata",
});

export default function Home() {
  return (
    <>
      <style>{`
        :root {
          --ground: #e6dbc7;
          --paper: #ddd0b9;
          --ink: #062b8a;
          --muted: #3a5aa8;
          --accent: #062b8a;
          --accent-ink: #e6dbc7;
          --radius: 0px;
        }
        .landing { background: var(--ground); color: var(--ink); font-family: var(--font-literata), Georgia, serif; }
        .landing * { box-sizing: border-box; }
        .landing h1, .landing h2, .landing h3 { font-family: var(--font-literata), Georgia, serif; font-weight: 500; letter-spacing: -0.02em; line-height: 1.05; }
        .landing p { font-family: var(--font-literata), Georgia, serif; font-weight: 400; line-height: 1.6; }
        .landing .display { font-size: clamp(3rem, 2rem + 5vw, 6rem); }
        .landing .head { font-size: clamp(2rem, 1.3rem + 3.2vw, 4rem); }
        .landing .lead { font-size: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem); }
        .landing .body { font-size: clamp(1.125rem, 1.05rem + 0.3vw, 1.3125rem); }
        .landing .small { font-size: clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem); }
        .landing .btn { background: var(--ink); color: var(--accent-ink); border: none; padding: 14px 28px; font-size: 1rem; font-weight: 500; cursor: pointer; border-radius: 0; transition: opacity 0.2s; }
        .landing .btn:hover { opacity: 0.8; }
        .landing .btn-outline { background: transparent; color: var(--ink); border: 2px solid var(--ink); padding: 12px 26px; font-size: 1rem; font-weight: 500; cursor: pointer; border-radius: 0; transition: background-color 0.2s, color 0.2s; }
        .landing .btn-outline:hover { background: var(--ink); color: var(--accent-ink); }
        .landing .card-panel { background: var(--paper); padding: 32px; }
        .landing .paper { background: var(--paper); }
        .landing .muted { color: var(--muted); }
        .landing .img { width: 100%; height: 100%; object-fit: cover; }
        .landing .zigzag { clip-path: polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%); }
        .landing .scallop { clip-path: polygon(0% 0%, 2.5% 100%, 5% 0%, 7.5% 100%, 10% 0%, 12.5% 100%, 15% 0%, 17.5% 100%, 20% 0%, 22.5% 100%, 25% 0%, 27.5% 100%, 30% 0%, 32.5% 100%, 35% 0%, 37.5% 100%, 40% 0%, 42.5% 100%, 45% 0%, 47.5% 100%, 50% 0%, 52.5% 100%, 55% 0%, 57.5% 100%, 60% 0%, 62.5% 100%, 65% 0%, 67.5% 100%, 70% 0%, 72.5% 100%, 75% 0%, 77.5% 100%, 80% 0%, 82.5% 100%, 85% 0%, 87.5% 100%, 90% 0%, 92.5% 100%, 95% 0%, 97.5% 100%, 100% 0%); }
        .landing .block-word { display: flex; gap: 4px; align-items: flex-end; }
        .landing .block-letter { background: var(--ink); color: var(--accent-ink); display: grid; place-items: center; font-weight: 600; padding: 0 8px; }
        .landing section { padding: 96px 24px; }
        .landing .section-inner { max-width: 1200px; margin: 0 auto; }
        .landing .dot-leader { border-bottom: 4px dotted var(--muted); flex: 1; margin: 0 8px; align-self: baseline; height: 0.6em; }
        .brew-selector { display: flex; flex-direction: column; gap: 12px; }
        .brew-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .brew-tab { background: transparent; border: 2px solid var(--ink); color: var(--ink); padding: 8px 16px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border-radius: 0; transition: background-color 0.2s, color 0.2s; }
        .brew-tab.active { background: var(--ink); color: var(--accent-ink); }
        .brew-card { background: var(--paper); padding: 20px; border: 2px solid var(--ink); }
        .brew-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 2px dotted var(--muted); }
        .brew-row:last-of-type { border-bottom: none; }
        .brew-note { margin-top: 12px; font-size: 0.875rem; color: var(--muted); font-style: italic; }
        .landing .img { width: 100%; height: 100%; object-fit: cover; }
        .landing .fade-in { opacity: 0; transform: translateY(24px); animation: fadeUp 0.8s ease forwards; }
        .landing .fade-in-2 { animation-delay: 0.15s; }
        .landing .fade-in-3 { animation-delay: 0.3s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .landing .fade-in { opacity: 1; transform: none; animation: none; }
        }
        @media (max-width: 768px) {
          .landing section { padding: 64px 16px; }
          .landing .section-inner { padding: 0 8px; }
        }
      `}</style>

      <div className={literata.className} style={{ background: "var(--ground)", color: "var(--ink)", minHeight: "100vh" }}>
        {/* ===== HERO: Card over a dim room ===== */}
        <section style={{ position: "relative", minHeight: "100svh", padding: 0, overflow: "hidden" }}>
          <Image
            src="/assets/espresso-machine-1.jpg"
            alt="Espresso machine on a kitchen counter"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", filter: "brightness(0.5)" }}
          />
          <div style={{ position: "relative", zIndex: 1, display: "grid", placeItems: "center", minHeight: "100svh", padding: "24px" }}>
            <div className="card-panel" style={{ width: "min(55vw, 720px)", minHeight: "62vh", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "clamp(1.5rem, 2.5vw, 2.375rem)", fontWeight: 500, letterSpacing: "-0.02em", flexWrap: "wrap", gap: "8px" }}>
                <span>Kindred</span>
                <span>Coffee</span>
                <span>Supply</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)", lineHeight: 1.3 }}>
                <div>100+ tools and beans</div>
                <div>5 categories</div>
                <div>Tested on real machines</div>
              </div>
              <div style={{ maxWidth: "30ch", fontSize: "clamp(1rem, 1.3vw, 1.25rem)", lineHeight: 1.5 }}>
                Tools and beans for people who take their morning cup seriously.
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <span className="small muted">Photo: Herr Andrax, CC BY-SA 3.0</span>
                <button className="btn">Shop the catalog</button>
                <a href="#chat" style={{ color: "var(--ink)", fontSize: "0.9rem", textDecoration: "underline" }}>Chat with the agent</a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== LIVE THING: Brew selector ===== */}
        <section style={{ background: "var(--paper)", padding: "64px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
            <div>
              <h2 className="head">Pick your brew.</h2>
              <p className="body muted" style={{ marginTop: "16px", maxWidth: "40ch" }}>
                The same gear, three ways to use it. Choose a method and the recipe updates: ratio, grind, temperature, time. Every number here is real.
              </p>
            </div>
            <BrewSelector />
          </div>
        </section>

        {/* ===== FEATURES as a menu ===== */}
        <section style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", background: "var(--paper)", padding: "40px 32px", position: "relative" }}>
            <div className="scallop" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "12px", background: "var(--ground)" }} />
            <h2 className="head" style={{ textAlign: "center", marginBottom: "40px" }}>What we offer</h2>
            {[
              { group: "The gear", items: [
                { name: "Espresso machines", value: "20 SKUs", desc: "Single and double boiler, heat exchanger, lever." },
                { name: "Grinders", value: "20 SKUs", desc: "Flat burr, conical, stepless." },
                { name: "Beans", value: "20 SKUs", desc: "Single origin, blends, decaf." },
                { name: "Accessories", value: "20 SKUs", desc: "Tampers, pitchers, scales, cups." },
                { name: "Bundles", value: "20 SKUs", desc: "Machine + grinder + beans, ready to brew." },
              ]},
              { group: "The agent", items: [
                { name: "Chat concierge", value: "included", desc: "Ask anything. Get honest answers." },
                { name: "Upsell and bundles", value: "gated", desc: "Every suggestion passes the margin floor." },
                { name: "Quote and checkout", value: "machine-callable", desc: "An agent can buy for you, end to end." },
              ]},
              { group: "The trust", items: [
                { name: "Policy Gate", value: "7 rules", desc: "Deterministic, deny-by-default." },
                { name: "Mandates", value: "15 min", desc: "Signed, scoped, time-bounded." },
                { name: "Receipts", value: "verifiable", desc: "Canonical signed JSON plus tamper-tester." },
                { name: "Audit trail", value: "hash-chained", desc: "Append-only, Realtime, tamper-evident." },
              ]},
            ].map((g) => (
              <div key={g.group} style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>{g.group}</div>
                {g.items.map((it) => (
                  <div key={it.name} style={{ marginBottom: "18px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontSize: "1.1875rem" }}>{it.name}</span>
                      <span className="dot-leader" />
                      <span className="small muted">{it.value}</span>
                    </div>
                    <div className="small muted" style={{ marginTop: "4px", maxWidth: "34ch" }}>{it.desc}</div>
                  </div>
                ))}
              </div>
            ))}
            <div className="scallop" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "12px", background: "var(--ground)", transform: "rotate(180deg)" }} />
          </div>
        </section>

        {/* ===== SHOWCASE: Square plate, spare text ===== */}
        <section style={{ background: "var(--paper)", padding: "96px 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center", minHeight: "88vh" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: "calc(100% - 40px)", aspectRatio: "1/1", position: "relative", overflow: "hidden" }}>
                <Image src="/assets/espresso-coffee-gear.jpg" alt="Espresso coffee gear: portafilter, tamper, pitcher" fill sizes="50vw" className="img" />
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <circle cx="50" cy="50" r="43" fill="none" stroke="var(--ink)" strokeWidth="0.6" />
                  <circle cx="50" cy="50" r="3" fill="var(--ink)" />
                </svg>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "60vh" }}>
              <div>
                <div style={{ display: "flex", gap: "24px", fontSize: "1.125rem", marginBottom: "32px" }}>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>Machines</span>
                  <span className="muted">Grinders</span>
                  <span className="muted">Beans</span>
                </div>
                <h2 className="head">The gear that earns its place.</h2>
                <p className="body muted" style={{ marginTop: "24px", maxWidth: "34ch" }}>
                  Curated espresso machines, grinders, beans, and accessories. Every piece chosen for the home barista who wants café-grade results without the café.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button className="btn">Shop machines</button>
                <button className="btn-outline">Browse all gear</button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS: Itinerary on a slip ===== */}
        <section style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "5fr 7fr", gap: "48px", alignItems: "start" }}>
            <div>
              <h2 className="head">From browse to brew.</h2>
              <p className="body muted" style={{ marginTop: "24px", maxWidth: "30ch" }}>
                Four steps, each one bounded and gated. The agent proposes, the gate decides, the receipt proves.
              </p>
            </div>
            <div className="paper" style={{ width: "min(480px, 100%)", padding: "32px 24px", position: "relative" }}>
              <div className="zigzag" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "12px", background: "var(--ground)", transform: "rotate(180deg)" }} />
              <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>Browse</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                <span>Talk to the Merchant Agent</span>
                <span className="dot-leader" />
                <span className="small muted">0 min</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "24px" }}>
                <span>Agent proposes a cart</span>
                <span className="dot-leader" />
                <span className="small muted">30 s</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>Quote</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                <span>Authoritative prices fetched</span>
                <span className="dot-leader" />
                <span className="small muted">2 s</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                <span>Mandate check (both envelopes)</span>
                <span className="dot-leader" />
                <span className="small muted">1 s</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "24px" }}>
                <span>Checkout and payment</span>
                <span className="dot-leader" />
                <span className="small muted">10 s</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>Receipt</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "24px" }}>
                <span>Audit trail entry written</span>
                <span className="dot-leader" />
                <span className="small muted">instant</span>
              </div>
              <div style={{ background: "var(--ink)", color: "var(--accent-ink)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500 }}>What you hold</span>
                <span>A receipt that verifies</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section style={{ background: "var(--paper)", padding: "96px 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", marginBottom: "64px" }}>
              {[
                { label: "Tools and beans", value: "100+" },
                { label: "Categories", value: "5" },
                { label: "Margin floor", value: "20%" },
                { label: "Max discount", value: "15%" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="display">{s.value}</div>
                  <div className="small muted" style={{ marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
              <div>
                <h2 className="head" style={{ marginBottom: "16px" }}>The numbers behind the cup.</h2>
                <p className="body muted" style={{ maxWidth: "40ch" }}>
                  A hundred tools and beans, five categories, one margin floor. Every figure here is real and every recommendation is gate-checked.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { name: "Machines", rev: "$840" },
                  { name: "Grinders", rev: "$440" },
                  { name: "Beans", rev: "$360" },
                  { name: "Accessories", rev: "$120" },
                ].map((c) => (
                  <div key={c.name} style={{ padding: "16px", background: "var(--ground)", borderRadius: "4px" }}>
                    <div className="small muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.name}</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "4px" }}>{c.rev}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRICING: The ticket ===== */}
        <section style={{ padding: "96px 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "min(64vw, 800px)", aspectRatio: "2.3/1", display: "grid", gridTemplateColumns: "7fr 3fr", position: "relative", background: "var(--paper)" }}>
              <div style={{ position: "absolute", top: "50%", left: "calc(70% - 14px)", transform: "translateY(-50%)", width: "28px", height: "28px", borderRadius: "50%", background: "var(--ground)", zIndex: 1 }} />
              <div style={{ position: "absolute", top: "50%", right: "calc(30% - 14px)", transform: "translateY(-50%)", width: "28px", height: "28px", borderRadius: "50%", background: "var(--ground)", zIndex: 1 }} />
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h2 className="head" style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}>Gear for every level.</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: "1rem" }}>
                  <div>Machines</div><div className="muted">$280 to $1,500</div>
                  <div>Grinders</div><div className="muted">$100 to $400</div>
                  <div>Beans</div><div className="muted">$15 to $40</div>
                  <div>Accessories</div><div className="muted">$10 to $60</div>
                </div>
              </div>
              <div style={{ borderLeft: "4px dotted var(--muted)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px", padding: "24px", position: "relative" }}>
                <div className="display" style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}>$280+</div>
                <div className="small muted">Starting price</div>
                <button className="btn" style={{ width: "100%" }}>Shop the catalog</button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" style={{ background: "var(--paper)", padding: "96px 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
            <div>
              <h2 className="head" style={{ marginBottom: "24px" }}>The questions people ask.</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9375rem", color: "var(--muted)", marginBottom: "32px" }}>
                <div>Test mode only. No real money moves.</div>
                <div>Free shipping on orders over $100.</div>
                <div>30-day returns on unused gear.</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  { q: "What is the Policy Gate?", a: "A deterministic service that vets every money-adjacent action. It holds veto over anything an LLM proposes: margin floor, category whitelist, price source-of-truth, spend caps, velocity limits." },
                  { q: "Can an AI agent really buy for me?", a: "Yes. The Buyer Agent fetches the catalog, reasons over a goal and budget, checks out via the machine surface, and completes a real test-mode payment with zero human clicks. Every step is receipted." },
                  { q: "How do I know the audit trail is honest?", a: "Each audit event stores a hash of its payload plus the previous event's hash. The tamper-tester recomputes and shows verification failing when a field is flipped. A third party can verify any receipt in about 30 seconds." },
                  { q: "What happens when a purchase is blocked?", a: "The gate returns a reason-coded verdict (e.g., margin_violation). The agent explains in plain language and offers an in-budget alternative. The block and the swap are both logged." },
                  { q: "Is this production-ready?", a: "It's demo-secure: enough for a demo and an interview. Not production-grade. All payments run in Razorpay test mode." },
                  { q: "What's the margin floor?", a: "20% net (35% for beans, 15% for machines), with a 15% max discount off list. Per-line: a bundle with one below-floor line is blocked for that line." },
                ].map((f, i) => (
                  <details key={i}>
                    <summary style={{ fontSize: "1.125rem", fontWeight: 500, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                      {f.q}
                      <span style={{ color: "var(--muted)", fontSize: "1.25rem" }}>+</span>
                    </summary>
                    <p className="body muted" style={{ marginTop: "8px", maxWidth: "56ch", fontSize: "0.9375rem" }}>{f.a}</p>
                  </details>
                ))}
              </div>
              <div style={{ marginTop: "32px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <button className="btn">Shop the catalog</button>
                <a href="#chat" style={{ color: "var(--ink)", textDecoration: "underline", fontSize: "0.875rem" }}>Chat with the agent</a>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ aspectRatio: "3/4", position: "relative", overflow: "hidden" }}>
                <Image src="/assets/rancilio-silvia-espresso-machine.jpg" alt="Rancilio Silvia espresso machine" fill sizes="40vw" className="img" />
              </div>
              <div style={{ position: "absolute", bottom: "-32px", right: "-16px", width: "38%", aspectRatio: "1/1", overflow: "hidden", border: "4px solid var(--ground)" }}>
                <Image src="/assets/peaberry-coffee-beans-close-up.jpg" alt="Peaberry coffee beans close up" fill sizes="20vw" className="img" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section style={{ background: "var(--ink)", color: "var(--ground)", padding: "96px 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "end" }}>
            <div>
              <h2 className="display" style={{ color: "var(--ground)", marginBottom: "24px" }}>
                Tools and beans for people who take their morning cup seriously.
              </h2>
              <p className="lead" style={{ color: "var(--ground)", opacity: 0.8, maxWidth: "40ch", margin: 0 }}>
                Every recommendation is gate-checked. Every purchase is receipted. Every receipt is verifiable. Start your morning right.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn" style={{ background: "var(--ground)", color: "var(--ink)", padding: "16px 32px", fontSize: "1rem" }}>Start shopping</button>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer style={{ background: "var(--ground)", padding: "64px 32px 32px", borderTop: "2px solid var(--border)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", marginBottom: "48px" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "12px", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Shop</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Machines</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Grinders</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Beans</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Accessories</div>
                <div className="small muted">Bundles</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "12px", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Agents</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Merchant Agent</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Buyer Agent</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Policy Gate</div>
                <div className="small muted">Audit trail</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "12px", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Company</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>About</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Blog</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Careers</div>
                <div className="small muted">Contact</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "12px", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Kindred Coffee Supply</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>12 Roastery Lane</div>
                <div className="small muted" style={{ marginBottom: "4px" }}>Portland, OR 97201</div>
                <div className="small muted">hello@kindredcoffee.supply</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "24px", flexWrap: "wrap", gap: "16px" }}>
              <span className="small muted">© 2026 Kindred Coffee Supply. All rights reserved.</span>
              <button className="btn" style={{ padding: "8px 16px", fontSize: "0.8125rem" }}>Get in touch</button>
            </div>
            <div className="small muted" style={{ marginTop: "16px" }}>
              Photos: &quot;Espresso machine 1&quot; by Herr Andrax (CC BY-SA 3.0); &quot;Espresso Coffee Gear&quot; by TheHolyCessna553 (CC0); &quot;Peaberry coffee beans, close up&quot; by Ragesoss (CC BY-SA 3.0); &quot;RANCILIO SILVIA espresso machine&quot; by Jmak (CC BY-SA 3.0) — all via Wikimedia Commons.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
