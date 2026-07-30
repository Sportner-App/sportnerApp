import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export type DynamicIconProps = {
  name: string;
  size?: number;
  color?: string;
};

/**
 * DynamicIcon - Dynamically renders FontAwesome6 icons from string names
 * Uses @expo/vector-icons FontAwesome6 family
 *
 * @param name - Icon name from database (e.g., "volleyball", "basketball", "person")
 * @param size - Icon size (default: 24)
 * @param color - Icon color (default: '#FFFFFF')
 *
 * @example
 * <DynamicIcon name="volleyball" size={24} color="#CCFF00" />
 * <DynamicIcon name="basketball" size={20} color="#38BDF8" />
 */
export function DynamicIcon({
  name,
  size = 24,
  color = "#FFFFFF",
}: DynamicIconProps) {
  // Normalize icon name for FontAwesome6
  const normalizedName = normalizeName(name);

  return (
    <FontAwesome6 name={normalizedName as any} size={size} color={color} />
  );
}

/**
 * Normalizes icon names to match FontAwesome6 format
 *
 * @param name - Raw icon name (e.g., "basketball", "Basketball", "ball_basketball")
 * @returns lowercase hyphenated icon name compatible with FontAwesome6
 *
 * @example
 * normalizeName("basketball") // "basketball"
 * normalizeName("Basketball") // "basketball"
 * normalizeName("ball_basketball") // "basketball"
 */
function normalizeName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") {
    return "circle-question";
  }

  // Normalize to lowercase with hyphens (FontAwesome format)
  const normalized = name
    .toLowerCase()
    .replace(/[_\s]+/g, "-") // Replace underscores and spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .replace(/^ball-/, ""); // Remove 'ball-' prefix if present

  return normalized || "circle-question";
}
