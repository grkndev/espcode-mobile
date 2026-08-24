import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [fontsLoaded, fontError] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "default",
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Protected guard={!false}>
              <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={!true}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
