import Icons from "@/components/Icons";
import Text from "@/components/Text";
import { Pressable, View } from "react-native";

export default function EditorHeader({
  fileName,
  isDirty,
  canUndo,
  canRedo,
  onBack,
  onUndo,
  onRedo,
  onPressRun,
  onPressMenu,
}: {
  fileName?: string;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPressRun: () => void;
  onPressMenu: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-2 py-2">
      <View className="flex-1 flex-row items-center gap-2">
        <Pressable onPress={onBack} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Icons name="IconChevronLeft" color="#e4e4e7" size={22} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-1.5">
          <Text weight="bold" numberOfLines={1} className="text-primary">
            {fileName ?? "espcode"}
          </Text>
          {isDirty && <View className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
        </View>
      </View>

      <View className="flex-row items-center gap-1">
        <Pressable onPress={onUndo} disabled={!canUndo} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Icons name="IconArrowBackUp" color={canUndo ? "#B0B4BA" : "#3f3f46"} size={19} />
        </Pressable>
        <Pressable onPress={onRedo} disabled={!canRedo} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Icons name="IconArrowForwardUp" color={canRedo ? "#B0B4BA" : "#3f3f46"} size={19} />
        </Pressable>
        <Pressable onPress={onPressRun} className="ml-1 flex-row items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5">
          <Icons name="IconPlayerPlayFilled" color="#ffffff" size={13} />
          <Text weight="bold" className="text-xs text-white">
            Run
          </Text>
        </Pressable>
        <Pressable onPress={onPressMenu} hitSlop={8} className="h-9 w-9 items-center justify-center">
          <Icons name="IconDotsVertical" color="#B0B4BA" size={19} />
        </Pressable>
      </View>
    </View>
  );
}
