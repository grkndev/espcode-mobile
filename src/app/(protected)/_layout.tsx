import { DeviceConnectionProvider } from "@/providers/device-connection-provider";
import { Stack } from "expo-router";

export default function _layout() {
  return (
    <DeviceConnectionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(screens)" />
      </Stack>
    </DeviceConnectionProvider>
  );
}
