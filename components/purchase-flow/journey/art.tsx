import * as React from "react";
import { formatPaise } from "@/lib/data/products";
import { RULES, type Evaluation } from "@/lib/purchase-flow/model";

export interface JourneyRefs {
  svg: SVGSVGElement | null;
  ticket: SVGGElement | null;
  products: (SVGGElement | null)[];
  lamps: (SVGGElement | null)[];
  barrier: SVGGElement | null;
  scanner: SVGGElement | null;
  receipt: SVGGElement | null;
  card: SVGGElement | null;
  belt: SVGGElement | null;
  screen: (SVGPathElement | null)[];
  bubbles: (SVGGElement | null)[];
  bubbleText: (SVGTextElement | null)[];
  handoffs: (SVGGElement | null)[];
  handoffText: SVGTextElement | null;
  buyerLeader: SVGPathElement | null;
}

export function emptyJourneyRefs(): JourneyRefs {
  return { svg: null, ticket: null, products: [], lamps: [], barrier: null, scanner: null, receipt: null, card: null, belt: null, screen: [], bubbles: [], bubbleText: [], handoffs: [], handoffText: null, buyerLeader: null };
}

function Screws({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return <g className="pj-screws">{[[x, y], [x + width, y], [x, y + height], [x + width, y + height]].map(([cx, cy], i) => (
    <g key={i}><circle cx={cx} cy={cy} r="2.5" /><path d={`M${cx! - 1} ${cy}h2`} /></g>
  ))}</g>;
}

function Product({ index }: { index: number }) {
  return <g className="pj-product-glyph" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {index === 0 && <><path d="M-10-10H10L5 8H-5ZM-13 11H13M-6-5L-3 6M0-6V6M6-5L3 6" /></>}
    {index === 1 && <><rect x="-7" y="-8" width="14" height="21" rx="3" /><path d="M0-8V-13H12M9-15H15V-11H9M-4-4H4M-4 0H4M-4 4H4" /></>}
    {index === 2 && <><path d="M-7-4Q-13 14 0 14Q13 14 7-4ZM7 0L15-9M-8 0C-21-4-16 14-9 9M-3-7H3M0-7V-10" /></>}
    {index === 3 && <><rect x="-14" y="-6" width="28" height="18" rx="4" /><path d="M-9-6V-11H9V-6" /><rect x="-5" y="3" width="10" height="5" rx="1" /></>}
    {index === 4 && <><path d="M-13-9H13L0 13ZM-8-9L0 6L8-9M-15-12H15" /></>}
    {index === 5 && <><path d="M-9-14H9L7-8L10 13H-10L-7-8ZM-7-8H7" /><ellipse cy="3" rx="4" ry="5" /><path d="M2-1L-2 7" /></>}
  </g>;
}

// A small transaction workbench, in a shallow front elevation: conveyor,
// proposal assembler, seven-interlock scanner, card reader and receipt printer.
// Solid, opaque faces establish depth; no SVG motion runs independently of the clock.
export function JourneyArt({ refs, evaluation, id }: { refs: JourneyRefs; evaluation: Evaluation; id: string }) {
  return <svg ref={(el) => { refs.svg = el; }} className="pj-art" viewBox="0 -12 1140 400" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>An order travels from the merchant, through a policy scanner, to checkout.</title>
    <desc id={`${id}-desc`}>Six coffee essentials form an order ticket. Seven policy interlocks check it. The barrier opens only on approval; a successful simulated payment prints a receipt.</desc>
    <defs>
      <clipPath id={`${id}-belt`}><rect x="57" y="279" width="1026" height="18" rx="9" /></clipPath>
      <clipPath id={`${id}-receipt`}><rect x="866" y="58" width="126" height="145" /></clipPath>
      <clipPath id={`${id}-scan`}><rect x="488" y="155" width="144" height="116" /></clipPath>
    </defs>

    {/* Chassis: feet, top face, fascia, seated screws and conveyor rollers. */}
    <ellipse className="pj-ground" cx="570" cy="333" rx="523" ry="11" />
    {[85, 327, 550, 790, 1030].map((x) => <g key={x}>
      <path className="pj-face-side" d={`M${x} 306v23h22v-23`} />
      <rect className="pj-foot" x={x - 6} y="327" width="34" height="6" rx="2" />
      <path className="pj-seam" d={`M${x + 5} 309v15m12-15v15`} />
    </g>)}
    <path className="pj-face-top" d="M58 267H1082L1100 281H40Z" />
    <rect className="pj-face" x="40" y="281" width="1060" height="31" rx="8" />
    <rect className="pj-belt" x="56" y="278" width="1028" height="20" rx="10" />
    <g clipPath={`url(#${id}-belt)`}>
      <g ref={(el) => { refs.belt = el; }} className="pj-rollers">
        {Array.from({ length: 45 }, (_, i) => <path key={i} d={`M${35 + i * 24} 279v18`} />)}
      </g>
    </g>
    <path className="pj-seam" d="M57 303H1083" />
    {[65, 375, 765, 1075].map((x) => <g className="pj-screws" key={x}><circle cx={x} cy="305" r="2" /><path d={`M${x - 1} 305h2`} /></g>)}

    {/* Merchant: desktop proposal assembler, supported screen, output tray. */}
    <g className="pj-device pj-device-merchant">
    <path className="pj-face-side" d="M163 197H216L225 249H154Z" />
    <path className="pj-face-top" d="M145 249H234L245 256H135Z" />
    <rect className="pj-face" x="135" y="256" width="110" height="8" rx="3" />
    <path className="pj-face-side" d="M93 92L104 84H294V193L283 203H93Z" />
    <rect className="pj-face" x="87" y="90" width="200" height="114" rx="10" />
    <rect className="pj-display" x="98" y="101" width="178" height="87" rx="4" />
    <path className="pj-seam" d="M99 120H275" />
    <g className="pj-indicator"><circle cx="108" cy="110" r="2" /><circle cx="116" cy="110" r="2" /><circle cx="124" cy="110" r="2" /></g>
    <path className="pj-fine" d="M246 110H263M242 114H263" />
    {["M111 135H211", "M111 145H250", "M111 155H230", "M111 172H157"].map((d, i) => <path key={d} ref={(el) => { refs.screen[i] = el; }} className="pj-screen-lines" d={d} />)}
    <circle className="pj-brand-fill" cx="270" cy="196" r="2" />
    <Screws x={94} y={97} width={186} height={100} />
    <path className="pj-face-top" d="M103 242H277L296 257H84Z" />
    <path className="pj-face-side" d="M84 257H296V267H84Z" />
    <path className="pj-seam" d="M96 257V263H284V257" />
    {[0, 1, 2, 3, 4, 5].map((i) => <g key={i} ref={(el) => { refs.products[i] = el; }} opacity="0">
      <Product index={i} />
    </g>)}
    </g>

    {/* Policy scanner: the rear portal and seven independently driven lamps. */}
    <g className="pj-device pj-device-gate">
    <path className="pj-face-side" d="M461 144L473 134H673V277H655V154H481V277H461Z" />
    <path className="pj-face" d="M454 140H660V277H636V165H478V277H454Z" />
    <rect className="pj-face-top" x="450" y="120" width="214" height="36" rx="8" />
    <path className="pj-seam" d="M461 160V269M649 160V269" />
    <Screws x={459} y={129} width={196} height={18} />
    <rect className="pj-face" x="514" y="67" width="86" height="54" rx="7" />
    <rect className="pj-display" x="521" y="74" width="72" height="39" rx="3" />
    <path className="pj-shield" d="M557 80L570 85V95C570 102 557 108 557 108S544 102 544 95V85Z" />
    <path className="pj-shield-check" d="M550 94L555 99L564 89" />
    <path className="pj-shield-x" d="M552 88L563 99M563 88L552 99" />
    {Array.from({ length: 7 }, (_, i) => <g key={i} ref={(el) => { refs.lamps[i] = el; }} className="pj-lamp" data-state="pending">
      <title>{RULES[i]!.short}</title>
      <rect className="pj-lamp-seat" x={481 + i * 22} y="128" width="17" height="19" rx="4" />
      <circle className="pj-lamp-light" cx={489.5 + i * 22} cy="137.5" r="4" />
      <path className="pj-lamp-check" d={`M${486.5 + i * 22} 137.5l2 2 4-4`} />
      <path className="pj-lamp-x" d={`M${487 + i * 22} 135l5 5m0-5-5 5`} />
    </g>)}
    <g clipPath={`url(#${id}-scan)`}>
      <g ref={(el) => { refs.scanner = el; }} opacity="0">
        <rect className="pj-scan-wash" x="480" y="155" width="160" height="35" />
        <path className="pj-scan-line" d="M480 190H640" />
      </g>
    </g>
    </g>

    {/* The moving proposal is drawn in front of the rear scanner frame. */}
    <g ref={(el) => { refs.ticket = el; }} opacity="0">
      <ellipse className="pj-ticket-shadow" cx="0" cy="45" rx="70" ry="6" />
      <path className="pj-ticket-side" d="M-64-42L-56-48H64V35L56 41H-64Z" />
      <rect className="pj-ticket-paper" x="-68" y="-44" width="128" height="84" rx="7" />
      <path className="pj-ticket-fold" d="M32-44V-23H60" />
      <path className="pj-ticket-rule" d="M-53-27H15M-53-18H-1" />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} className="pj-ticket-item" x={-53 + i * 15} y="-6" width="10" height="10" rx="2" />)}
      <text className="pj-money" x="-53" y="26">{formatPaise(evaluation.totalPaise)}</text>
    </g>

    {/* Physical interlock sits in front of the proposal and stays shut on veto. */}
    <g className="pj-device pj-device-gate">
    <rect className="pj-face-side" x="648" y="226" width="14" height="51" rx="3" />
    <rect className="pj-face-top" x="642" y="264" width="27" height="13" rx="3" />
    <g ref={(el) => { refs.barrier = el; }}>
      <rect className="pj-barrier" x="-156" y="-7" width="159" height="14" rx="4" />
      {Array.from({ length: 7 }, (_, i) => <path className="pj-barrier-stripe" key={i} d={`M${-143 + i * 21}-5l-6 10`} />)}
    </g>
    <circle className="pj-face" cx="655" cy="226" r="12" />
    <circle className="pj-interlock-dot" cx="655" cy="226" r="5" />
    </g>

    {/* Checkout: receipt emerges behind a real paper slot; card enters the reader. */}
    <g className="pj-device pj-device-buyer">
    <g clipPath={`url(#${id}-receipt)`}>
      <g ref={(el) => { refs.receipt = el; }} opacity="0">
        <path className="pj-receipt-paper" d="M878 67H980V202L974 198L968 202L962 198L956 202L950 198L944 202L938 198L932 202L926 198L920 202L914 198L908 202L902 198L896 202L890 198L884 202L878 198Z" />
        <circle className="pj-receipt-seal" cx="929" cy="90" r="12" />
        <path className="pj-receipt-check" d="M923 90L928 95L936 85" />
        <path className="pj-receipt-lines" d="M892 116H966M892 126H947M892 136H966M892 147H966" />
        <text className="pj-receipt-money" x="891" y="165">{formatPaise(evaluation.totalPaise)}</text>
        <g className="pj-barcode">{Array.from({ length: 23 }, (_, i) => <path key={i} strokeWidth={i % 3 === 0 ? 2 : 1} d={`M${893 + i * 3.2} 176v12`} />)}</g>
      </g>
    </g>
    <path className="pj-face-top" d="M850 191L867 178H1003L1016 191V271H850Z" />
    <rect className="pj-face" x="842" y="191" width="174" height="86" rx="9" />
    <rect className="pj-slot" x="865" y="192" width="128" height="8" rx="4" />
    <path className="pj-seam" d="M851 252H1007" />
    <rect className="pj-display" x="865" y="215" width="68" height="24" rx="4" />
    <path className="pj-fine" d="M874 224H924M874 230H904" />
    <circle className="pj-pay-light" cx="983" cy="224" r="7" />
    <path className="pj-paid-check" d="M979 224L982 227L987 221" />
    <path className="pj-declined-x" d="M979 220L987 228M987 220L979 228" />
    <Screws x={852} y={201} width={154} height={65} />
    <g className="pj-vents">{Array.from({ length: 7 }, (_, i) => <rect key={i} x={865 + i * 8} y="260" width="4" height="6" rx="1" />)}</g>
    <path className="pj-face-side" d="M1028 194L1040 182H1080V268L1068 277H1028Z" />
    <rect className="pj-face" x="1020" y="194" width="49" height="83" rx="6" />
    <rect className="pj-display" x="1027" y="203" width="35" height="25" rx="3" />
    <path className="pj-fine" d="M1034 211H1055M1034 218H1048" />
    {[0, 1, 2].map((row) => [0, 1, 2].map((col) => <rect key={`${row}-${col}`} className="pj-key" x={1028 + col * 12} y={236 + row * 10} width="8" height="6" rx="1.5" />))}
    <rect className="pj-slot" x="1065" y="215" width="6" height="35" rx="2" />
    <g ref={(el) => { refs.card = el; }} opacity="0">
      <rect className="pj-payment-card" x="0" y="0" width="49" height="32" rx="5" />
      <rect className="pj-card-chip" x="8" y="10" width="9" height="9" rx="2" />
      <path className="pj-card-etch" d="M8 25H24M36 10Q42 16 36 22M32 12Q36 16 32 20" />
    </g>
    </g>

    {/* Explanatory annotations follow the transaction, not a separate timer.
        Short bubbles identify each step; handoff arrows show the next action. */}
    {[190, 557, 930].map((x, i) => <g key={x} ref={(el) => { refs.bubbles[i] = el; }} className="pj-bubble" data-tone="waiting">
      <path ref={i === 2 ? (el) => { refs.buyerLeader = el; } : undefined} className="pj-bubble-leader" d={i === 2 ? "M1027 38C1052 53 1045 95 1045 173m-4-6 4 6 4-6" : `M${x} 38V${i === 0 ? 80 : 59}m-4-6 4 6 4-6`} />
      <rect className="pj-bubble-paper" x={x - 107} y="4" width="214" height="34" rx="10" />
      <circle className="pj-bubble-dot" cx={x - 91} cy="21" r="2.5" />
      <text ref={(el) => { refs.bubbleText[i] = el; }} className="pj-bubble-text" x={x + 3} y="22" textAnchor="middle" dominantBaseline="middle">{["Request received", "Awaiting proposal", "Waiting for approval"][i]}</text>
    </g>)}
    <g ref={(el) => { refs.handoffs[0] = el; }} className="pj-handoff" data-state="waiting">
      <path className="pj-handoff-line" d="M310 197C348 181 401 181 440 197m-6-8 6 8-10 1" />
      <rect className="pj-handoff-paper" x="328" y="145" width="98" height="28" rx="9" />
      <text className="pj-handoff-text" x="377" y="160" textAnchor="middle" dominantBaseline="middle">Proposal</text>
    </g>
    <g ref={(el) => { refs.handoffs[1] = el; }} className="pj-handoff" data-state="waiting">
      <path className="pj-handoff-line pj-next-arrow" d="M688 197C726 181 782 181 825 197m-6-8 6 8-10 1" />
      <g className="pj-stop-arrow">
        <path className="pj-handoff-line" d="M688 197H741" />
        <circle cx="752" cy="197" r="8" />
        <path d="M749 194L755 200M755 194L749 200" />
      </g>
      <rect className="pj-handoff-paper" x="699" y="145" width="116" height="28" rx="9" />
      <text ref={(el) => { refs.handoffText = el; }} className="pj-handoff-text" x="757" y="160" textAnchor="middle" dominantBaseline="middle">After approval</text>
    </g>
  </svg>;
}
