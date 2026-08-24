import { useColorScheme as useColorSchemeCore } from "react-native";

export function useColorScheme() {
  const coreScheme = useColorSchemeCore();

  return coreScheme === "dark" ? "dark" : "light";
}
