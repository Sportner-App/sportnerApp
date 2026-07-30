import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

// Mapping of event type names to FontAwesome6 icon names
const EVENT_ICON_MAP: Record<string, string> = {
  activity: "person-running",
  bike: "person-biking",
  circle: "circle",
  dumbbell: "dumbbell",
  footprints: "shoe-prints",
  gamepad: "gamepad",
  heart: "heart-pulse",
  trophy: "trophy",
  waves: "water",
  zap: "bolt",
};

export function getEventIcon(iconName?: string | null) {
  const normalizedName = (iconName || "dumbbell")
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^ball-/, "");

  return EVENT_ICON_MAP[normalizedName] || "dumbbell";
}
