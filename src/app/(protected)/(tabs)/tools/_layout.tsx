import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function ToolsStackLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="upload-firmware" options={{ animation: "none" }} />
      <Stack.Screen name="filesystem" options={{ animation: "none" }} />
      <Stack.Screen name="flash-log" options={{ animation: "none" }} />
      <Stack.Screen name="chip-info" options={{ animation: "none" }} />
      <Stack.Screen name="erase-chip" options={{ animation: "none" }} />
    </Stack>
  );
}
