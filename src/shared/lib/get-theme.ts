import { colors } from "@/shared/config/colors";
import { useColorScheme } from "@/shared/lib/use-color-scheme";

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return colors[colorScheme];
}
