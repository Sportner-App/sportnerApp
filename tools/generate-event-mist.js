/**
 * Etkinlik kartındaki sis katmanını PNG olarak üretir:
 * assets/images/event-card-mist.png
 *
 * Neden: Sis önceden react-native-svg ile 4 gradyan katmanı olarak çiziliyordu.
 * iOS'ta SVG ana thread'de CPU ile çiziliyor; ekrana aynı anda birkaç kart
 * girince (ör. Etkinliklerim'de boş sekmeden dolu sekmeye geçiş) ana thread
 * tıkanıyor ve animasyonlar takılıyordu. PNG bir kez çözülüp önbellekte
 * kalıyor ve GPU'da birleştiriliyor.
 *
 * Çıktı beyaz + alfa bir maske; renk uygulamada `tintColor` ile veriliyor.
 * Gradyanlar kartın kutusuna göre (objectBoundingBox) tanımlı olduğu için
 * görsel `resizeMode="stretch"` ile esnetildiğinde eski SVG'yle aynı görünür.
 *
 * Gradyan değerleri eski MistOverlay SVG'sinden birebir alındı. Değiştirirsen:
 *   node tools/generate-event-mist.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const WIDTH = 720;
const HEIGHT = 450;
const OUT = path.join(__dirname, "../assets/images/event-card-mist.png");

/** Duraklar arası doğrusal opaklık; aralık dışında uçtaki değer (pad). */
function stopOpacity(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [o1, a1] = stops[i];
    if (t <= o1) {
      const [o0, a0] = stops[i - 1];
      return a0 + ((a1 - a0) * (t - o0)) / (o1 - o0);
    }
  }
  return stops[stops.length - 1][1];
}

const layers = [
  // mist-left: x1=0 → x2=1
  {
    t: (x) => x,
    stops: [
      [0, 0.68],
      [0.28, 0.18],
      [0.5, 0.1],
    ],
  },
  // mist-bottom: y1=1 → y2=0
  {
    t: (_x, y) => 1 - y,
    stops: [
      [0, 0.28],
      [0.1, 0.48],
      [0.22, 0.12],
      [0.32, 0],
    ],
  },
  // mist-radial-left: c=(12%,78%), r=(72%,108%)
  {
    t: (x, y) => Math.hypot((x - 0.12) / 0.72, (y - 0.78) / 1.08),
    stops: [
      [0, 0.94],
      [0.35, 0.62],
      [0.62, 0.02],
      [1, 0],
    ],
  },
  // mist-radial-right: c=(92%,92%), r=(36%,64%)
  {
    t: (x, y) => Math.hypot((x - 0.92) / 0.36, (y - 0.92) / 0.64),
    stops: [
      [0, 0.9],
      [0.45, 0.48],
      [0.78, 0.1],
      [1, 0],
    ],
  },
];

// Her satır: filtre baytı (0) + RGBA pikseller.
const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 4));
for (let py = 0; py < HEIGHT; py++) {
  const row = py * (1 + WIDTH * 4);
  raw[row] = 0;
  const y = (py + 0.5) / HEIGHT;
  for (let px = 0; px < WIDTH; px++) {
    const x = (px + 0.5) / WIDTH;
    // Katmanların hepsi aynı renkte: üst üste bindirme yalnızca alfayı
    // birleştirir (source-over).
    let transparency = 1;
    for (const layer of layers) {
      transparency *= 1 - stopOpacity(layer.stops, layer.t(x, y));
    }
    const i = row + 1 + px * 4;
    raw[i] = 255;
    raw[i + 1] = 255;
    raw[i + 2] = 255;
    raw[i + 3] = Math.round((1 - transparency) * 255);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header[8] = 8; // bit derinliği
header[9] = 6; // RGBA
header[10] = 0;
header[11] = 0;
header[12] = 0;

fs.writeFileSync(
  OUT,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]),
);
console.log(`${path.relative(process.cwd(), OUT)} (${WIDTH}x${HEIGHT})`);
