import Icons from "@/components/Icons";
import SafeAreaView from "@/components/SafeAreaView";
import Text from "@/components/Text";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function ToolScreenModal({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={() => router.back()}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <SafeAreaView className="flex-1 bg-background">
              <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
                <Text weight="bold" className="text-xl text-primary">
                  {title}
                </Text>
                <Pressable
                  onPress={() => router.back()}
                  className="h-9 w-9 items-center justify-center rounded-full bg-element"
                >
                  <Icons name="IconX" color="#B0B4BA" size={18} />
                </Pressable>
              </View>
              <View className="h-px bg-zinc-800" />
              <View className="flex-1">{children}</View>
            </SafeAreaView>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
}
