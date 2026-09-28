#!/usr/bin/env node
/**
 * Sportner Mapbox classic style re-colorizer.
 *
 * Kaynak palet: src/constants/map.ts > DARK_MAP_STYLE (Google Maps stili).
 * Hedef: mapbox://styles/yagizerdenler/... (classic dark-v11 turevi, 50 katman)
 *
 * Renk tasiyan paint property'lerini palete gore yeniden yazar.
 * line-width / opacity gibi zoom ifadelerine dokunmaz.
 *
 * Kullanim: node restyle.js <girdi.json> <cikti.json>
 */

const fs = require("fs");

// --- Palet -----------------------------------------------------------------

const C = {
  land: "#06111a",

  // Deniz. Ilk denemede #0b1220 idi; Kadikoy ekran goruntusunde deniz/kara
  // luminans farki 0.0027 olcuUldu (pratikte gorunmez) ve deniz karadan acik
  // kaliyordu. Belirgin sekilde mavilestirildi + kiyiya ince kontur eklendi.
  water: "#0a1a2e",
  waterEdge: "#1d3550",

  // Yesil alanlar. Google stilinde park (#132033) ve POI (#152238) ayirt
  // edilemiyordu; yesile cekildi. pitch = spor sahasi, en belirgin ton.
  pitch: "#15332a",
  park: "#122a24",
  agriculture: "#0f1a20",
  residential: "#0b1622",
  airportLand: "#101b28",
  landuseOther: "#0e1a28",

  road: "#1e2d46",
  roadHighway: "#243552",
  roadMinor: "#1a2740",
  roadDim: "#16233a", // tunel
  roadCase: "#06111a",
  rail: "#152238",

  building: "#0d1826",
  structure: "#0e1a28",

  admin: "#1e293b",
  adminBg: "#06111a",

  label: "#94a3b8",
  labelStrong: "#cbd5e1",
  labelMuted: "#64748b",
  labelWater: "#475569",
  halo: "#06111a",
  haloSoft: "rgba(6, 17, 26, 0.5)",
};

// --- Ifade yardimcilari ----------------------------------------------------

const HIGHWAY = ["motorway", "trunk", "motorway_link", "trunk_link"];

/** Otoyollari govde renginden ayiran match ifadesi. */
const roadMatch = (highway, rest) => [
  "match",
  ["get", "class"],
  HIGHWAY,
  highway,
  rest,
];

/** landuse katmanindaki karisik siniflari ayristiran match ifadesi. */
const landuseMatch = [
  "match",
  ["get", "class"],
  "pitch",
  C.pitch,
  ["park", "grass", "wood", "scrub"],
  C.park,
  "agriculture",
  C.agriculture,
  "residential",
  C.residential,
  ["airport", "glacier", "sand"],
  C.airportLand,
  C.landuseOther,
];

/** symbolrank hiyerarsisini koruyan yerlesim etiketi rengi. */
const settlementStep = [
  "step",
  ["get", "symbolrank"],
  C.labelStrong,
  11,
  C.label,
  16,
  C.labelMuted,
];

/** Spor POI'leri park POI'lerinden daha parlak okunsun. */
const poiTextMatch = [
  "match",
  ["get", "class"],
  "sport_and_leisure",
  C.label,
  C.labelMuted,
];

// --- Katman -> renk tablosu (50/50 acik sekilde listelenir) ----------------

const LAYERS = {
  // Zemin ve doga
  land: { "background-color": C.land },
  // national-park'in fill-opacity'si z12'de 0.2 idi: ormanlar landuse
  // parklarindan (tam opaklik) belirgin soluk kaliyordu. Once 0.9 denendi
  // ama Kadikoy kiyisinda yesil serit araziyi bastirdi (karaya deltaE 15.6,
  // v1'de bu karede yesil orani %0 idi). 0.55 ikisinin arasi.
  "national-park": {
    "fill-color": C.park,
    "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.45, 12, 0.55],
  },
  landuse: { "fill-color": landuseMatch },
  waterway: { "line-color": C.water },
  water: { "fill-color": C.water, "fill-outline-color": C.waterEdge },
  "land-structure-polygon": { "fill-color": C.structure },
  "land-structure-line": { "line-color": C.structure },
  "aeroway-polygon": { "fill-color": C.airportLand },
  "aeroway-line": { "line-color": C.road },
  building: { "fill-color": C.building, "fill-outline-color": C.roadCase },

  // Tuneller (sonuk)
  "tunnel-path-trail": { "line-color": C.roadDim },
  "tunnel-path-cycleway-piste": { "line-color": C.roadDim },
  "tunnel-path": { "line-color": C.roadDim },
  "tunnel-steps": { "line-color": C.roadDim },
  "tunnel-pedestrian": { "line-color": C.roadDim },
  "tunnel-simple": { "line-color": roadMatch(C.road, C.roadDim) },

  // Yollar
  "road-path-trail": { "line-color": C.roadMinor },
  "road-path-cycleway-piste": { "line-color": C.roadMinor },
  "road-path": { "line-color": C.roadMinor },
  "road-steps": { "line-color": C.roadMinor },
  "road-pedestrian": { "line-color": C.roadMinor },
  "road-simple": { "line-color": roadMatch(C.roadHighway, C.road) },
  "road-rail": { "line-color": C.rail },

  // Koprular
  "bridge-path-trail": { "line-color": C.roadMinor },
  "bridge-path-cycleway-piste": { "line-color": C.roadMinor },
  "bridge-path": { "line-color": C.roadMinor },
  "bridge-steps": { "line-color": C.roadMinor },
  "bridge-pedestrian": { "line-color": C.roadMinor },
  "bridge-case-simple": { "line-color": C.roadCase },
  "bridge-simple": { "line-color": roadMatch(C.roadHighway, C.road) },
  "bridge-rail": { "line-color": C.rail },

  // Idari sinirlar
  "admin-1-boundary-bg": { "line-color": C.adminBg },
  "admin-0-boundary-bg": { "line-color": C.adminBg },
  "admin-1-boundary": { "line-color": C.admin },
  "admin-0-boundary": { "line-color": C.admin },
  "admin-0-boundary-disputed": { "line-color": C.admin },

  // Etiketler
  "road-label-simple": { "text-color": C.label, "text-halo-color": C.halo },
  "waterway-label": {
    "text-color": C.labelWater,
    "text-halo-color": C.haloSoft,
  },
  "natural-line-label": {
    "text-color": C.labelWater,
    "text-halo-color": C.halo,
  },
  "natural-point-label": {
    "text-color": C.labelWater,
    "text-halo-color": C.halo,
  },
  "water-line-label": {
    "text-color": C.labelWater,
    "text-halo-color": C.haloSoft,
  },
  "water-point-label": {
    "text-color": C.labelWater,
    "text-halo-color": C.haloSoft,
  },
  "poi-label": { "text-color": poiTextMatch, "text-halo-color": C.halo },
  "airport-label": { "text-color": C.labelMuted, "text-halo-color": C.halo },
  "settlement-subdivision-label": {
    "text-color": C.labelMuted,
    "text-halo-color": C.halo,
  },
  "settlement-minor-label": {
    "text-color": settlementStep,
    "text-halo-color": C.halo,
  },
  "settlement-major-label": {
    "text-color": settlementStep,
    "text-halo-color": C.halo,
  },
  "state-label": { "text-color": C.labelMuted, "text-halo-color": C.halo },
  "country-label": { "text-color": C.label, "text-halo-color": C.halo },
  "continent-label": { "text-color": C.label, "text-halo-color": C.halo },
};

/**
 * POI gurultusunu kes: restoran / magaza / otel etiketleri etkinlik
 * pinlerinin okunurlugunu bozuyor. Spor tesisleri ve yesil alanlar kalir.
 */
const POI_KEEP = ["sport_and_leisure", "park_like"];

/**
 * Normalde sadece katmanda zaten var olan paint anahtarlarina dokunuruz;
 * boylece yanlislikla desteklenmeyen bir property eklemeyiz. Asagidakiler
 * bilincli eklemelerdir (kiyi konturu gibi).
 */
const ADDITIVE = new Set(["water:fill-outline-color"]);

// --- Uygulama --------------------------------------------------------------

function main() {
  const [, , inPath, outPath] = process.argv;

  if (!inPath || !outPath) {
    console.error("Kullanim: node restyle.js <girdi.json> <cikti.json>");
    process.exit(1);
  }

  const style = JSON.parse(fs.readFileSync(inPath, "utf8"));
  const seen = new Set();
  const report = [];
  const problems = [];

  for (const layer of style.layers) {
    const spec = LAYERS[layer.id];

    if (!spec) {
      problems.push(`tabloda yok: ${layer.id}`);
      continue;
    }

    seen.add(layer.id);
    layer.paint = layer.paint || {};
    const applied = [];

    for (const [key, value] of Object.entries(spec)) {
      const additive = ADDITIVE.has(`${layer.id}:${key}`);

      if (!(key in layer.paint) && !additive) {
        problems.push(`${layer.id}: '${key}' katmanda yok, atlandi`);
        continue;
      }

      layer.paint[key] = value;
      applied.push(additive && !(key in layer.paint) ? `+${key}` : key);
    }

    if (layer.id === "poi-label") {
      const keep = ["in", ["get", "class"], ["literal", POI_KEEP]];
      layer.filter = Array.isArray(layer.filter)
        ? ["all", layer.filter, keep]
        : keep;
      applied.push("filter");
    }

    report.push(`  ${layer.id.padEnd(32)} ${applied.join(", ")}`);
  }

  for (const id of Object.keys(LAYERS)) {
    if (!seen.has(id)) {
      problems.push(`tabloda var ama style'da yok: ${id}`);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(style, null, 2));

  console.log(`Style katmani : ${style.layers.length}`);
  console.log(`Islenen       : ${report.length}`);
  console.log(`Uyari         : ${problems.length}`);
  console.log("\n--- Uygulananlar ---");
  report.forEach((l) => console.log(l));

  if (problems.length > 0) {
    console.log("\n--- UYARILAR ---");
    problems.forEach((p) => console.log("  ! " + p));
  }
}

main();
