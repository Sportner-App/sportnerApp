import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

interface SportIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const SportIcon = ({
  name,
  size = 24,
  color = "#10B981",
}: SportIconProps) => {
  const normalizedName = name
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^ball-/, "");

  return (
    <FontAwesome6 name={normalizedName as any} size={size} color={color} />
  );
};
