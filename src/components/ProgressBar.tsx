import { View } from "react-native";

export default function ProgressBar({ progress, color = "#7e22ce" }: { progress: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-element">
      <View className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </View>
  );
}
