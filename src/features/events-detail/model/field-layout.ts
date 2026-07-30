/**
 * Field layout calculations and types
 */

export type SlotPoint = {
  x: number;
  y: number;
};

export type FieldLayout = {
  width: number;
  height: number;
  points: SlotPoint[];
};

// Re-export constants for convenience
export { SPECIAL_FIELD_SPORTS } from "./field-constants";

export function buildGridPoints(
  count: number,
  width: number,
  height: number,
  columns = 3,
): SlotPoint[] {
  const safeColumns = Math.max(1, columns);
  const rows = Math.ceil(count / safeColumns);
  const xGap = width / (safeColumns + 1);
  const yGap = height / (rows + 1);
  const points: SlotPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    const col = i % safeColumns;
    const row = Math.floor(i / safeColumns);

    points.push({
      x: xGap * (col + 1),
      y: yGap * (row + 1),
    });
  }

  return points;
}

export function getSportLayout(
  sportType: string,
  maxPlayers: number,
): FieldLayout {
  const slotCount = Math.max(maxPlayers, 1);

  if (sportType === "football") {
    const base: SlotPoint[] = [
      { x: 90, y: 210 },
      { x: 190, y: 105 },
      { x: 190, y: 315 },
      { x: 300, y: 75 },
      { x: 300, y: 210 },
      { x: 300, y: 345 },
      { x: 430, y: 95 },
      { x: 430, y: 210 },
      { x: 430, y: 325 },
      { x: 560, y: 160 },
      { x: 560, y: 260 },
    ];
    const extra = buildGridPoints(
      Math.max(0, slotCount - base.length),
      680,
      420,
      4,
    );
    return {
      width: 680,
      height: 420,
      points: [...base.slice(0, slotCount), ...extra],
    };
  }

  if (sportType === "basketball") {
    const base: SlotPoint[] = [
      { x: 120, y: 190 },
      { x: 250, y: 100 },
      { x: 250, y: 280 },
      { x: 390, y: 100 },
      { x: 390, y: 280 },
      { x: 560, y: 190 },
      { x: 490, y: 190 },
      { x: 320, y: 190 },
      { x: 185, y: 190 },
      { x: 595, y: 190 },
    ];
    const extra = buildGridPoints(
      Math.max(0, slotCount - base.length),
      680,
      380,
      4,
    );
    return {
      width: 680,
      height: 380,
      points: [...base.slice(0, slotCount), ...extra],
    };
  }

  if (sportType === "volleyball") {
    const base: SlotPoint[] = [
      { x: 160, y: 120 },
      { x: 285, y: 120 },
      { x: 410, y: 120 },
      { x: 160, y: 270 },
      { x: 285, y: 270 },
      { x: 410, y: 270 },
      { x: 535, y: 120 },
      { x: 535, y: 270 },
      { x: 95, y: 120 },
      { x: 95, y: 270 },
      { x: 600, y: 120 },
      { x: 600, y: 270 },
    ];
    const extra = buildGridPoints(
      Math.max(0, slotCount - base.length),
      700,
      390,
      4,
    );
    return {
      width: 700,
      height: 390,
      points: [...base.slice(0, slotCount), ...extra],
    };
  }

  if (sportType === "tennis" || sportType === "padel") {
    const base: SlotPoint[] = [
      { x: 170, y: 105 },
      { x: 460, y: 105 },
      { x: 170, y: 265 },
      { x: 460, y: 265 },
    ];
    const extra = buildGridPoints(
      Math.max(0, slotCount - base.length),
      620,
      350,
      2,
    );
    return {
      width: 620,
      height: 350,
      points: [...base.slice(0, slotCount), ...extra],
    };
  }

  if (sportType === "table_tennis") {
    const base: SlotPoint[] = [
      { x: 170, y: 180 },
      { x: 470, y: 180 },
      { x: 170, y: 95 },
      { x: 470, y: 265 },
    ];
    const extra = buildGridPoints(
      Math.max(0, slotCount - base.length),
      640,
      360,
      2,
    );
    return {
      width: 640,
      height: 360,
      points: [...base.slice(0, slotCount), ...extra],
    };
  }

  const width = 680;
  const height = 380;
  const columns = slotCount <= 4 ? 2 : 3;
  return {
    width,
    height,
    points: buildGridPoints(slotCount, width, height, columns),
  };
}
