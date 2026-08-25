import Icons from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import Text from "@/components/Text";
import { Fonts } from "@/constants/theme";
import type { LogLevel, LogLine, RunMode, RunStatus } from "@/hooks/use-run-session";
import { FlatList, Pressable, View } from "react-native";

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: "text-zinc-200",
  warn: "text-amber-400",
  error: "text-red-400",
  system: "text-purple-400",
};

const STAGE_LABEL: Partial<Record<RunStatus, string>> = {
  compiling: "Compiling",
  uploading: "Uploading",
  verifying: "Verifying",
  success: "Done",
  error: "Failed",
};

export default function ConsoleBody({
  mode,
  status,
  progress,
  logs,
  onClear,
}: {
  mode: RunMode | null;
  status: RunStatus;
  progress: number;
  logs: LogLine[];
  onClear: () => void;
}) {
  if (status === "idle") {
    return (
      <View className="flex-1 items-center justify-center gap-2 px-10">
        <Icons name="IconTerminal2" color="#3f3f46" size={32} />
        <Text weight="bold" className="mt-1 text-center text-base text-primary">
          No run yet
        </Text>
        <Text className="text-center text-sm text-secondary">Tap Run to compile or upload this project.</Text>
      </View>
    );
  }

  const isRunning = status === "compiling" || status === "uploading" || status === "verifying";

  return (
    <View className="flex-1">
      <View className="gap-2 px-4 pt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-secondary">
            {mode === "upload" ? "Compile & Upload" : "Compile"} · {STAGE_LABEL[status]}
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-xs text-zinc-600">{Math.round(progress)}%</Text>
            <Pressable onPress={onClear} disabled={isRunning} hitSlop={8}>
              <Icons name="IconTrash" color={isRunning ? "#3f3f46" : "#71717a"} size={15} />
            </Pressable>
          </View>
        </View>
        <ProgressBar progress={progress} color={status === "error" ? "#dc2626" : undefined} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row gap-3 py-1">
            <Text style={{ fontFamily: Fonts?.mono }} className="text-[13px] text-zinc-600">
              {item.time}
            </Text>
            <Text style={{ fontFamily: Fonts?.mono }} className={`flex-1 text-[13px] ${LEVEL_COLOR[item.level]}`}>
              {item.text}
            </Text>
          </View>
        )}
        contentContainerClassName="px-4 py-4"
        className="flex-1"
      />
    </View>
  );
}
