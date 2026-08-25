import Icons from "@/components/Icons";
import Text from "@/components/Text";
import type { FileMeta } from "@/constants/mock-projects";
import type { RunStatus } from "@/hooks/use-run-session";
import { Pressable, ScrollView, View } from "react-native";

const RUN_DOT_COLOR: Partial<Record<RunStatus, string>> = {
  compiling: "#a855f7",
  uploading: "#a855f7",
  verifying: "#a855f7",
  success: "#34d399",
  error: "#f87171",
};

export default function TabStrip({
  files,
  openTabs,
  activeTabId,
  dirtyIds,
  runStatus,
  onSelectTab,
  onCloseTab,
  onPressAdd,
}: {
  files: FileMeta[];
  openTabs: string[];
  activeTabId: string;
  dirtyIds: Set<string>;
  runStatus: RunStatus;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onPressAdd: () => void;
}) {
  const filesById = Object.fromEntries(files.map((f) => [f.id, f]));
  const runDotColor = RUN_DOT_COLOR[runStatus];

  return (
    <View className="flex-row items-center border-b border-zinc-800">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerClassName="items-center pl-2">
        {openTabs.map((id) => {
          const file = filesById[id];
          if (!file) return null;
          const active = id === activeTabId;
          const dirty = dirtyIds.has(id);
          return (
            <Pressable
              key={id}
              onPress={() => onSelectTab(id)}
              className={`ml-1 flex-row items-center gap-1.5 border-b-2 px-3 py-2.5 ${
                active ? "border-purple-600" : "border-transparent"
              }`}
            >
              {dirty && <View className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
              <Text weight={active ? "bold" : "regular"} className={active ? "text-primary" : "text-secondary"}>
                {file.name}
              </Text>
              <Pressable hitSlop={8} onPress={() => onCloseTab(id)} className="ml-0.5">
                <Icons name="IconX" color="#52525b" size={13} />
              </Pressable>
            </Pressable>
          );
        })}
        <Pressable onPress={onPressAdd} className="ml-2 h-7 w-7 items-center justify-center rounded-full bg-element">
          <Icons name="IconPlus" color="#B0B4BA" size={14} />
        </Pressable>
      </ScrollView>

      <Pressable
        onPress={() => onSelectTab("console")}
        className={`flex-row items-center gap-1.5 border-b-2 px-3 py-2.5 ${
          activeTabId === "console" ? "border-purple-600" : "border-transparent"
        }`}
      >
        <Icons name="IconTerminal2" color={activeTabId === "console" ? "#e4e4e7" : "#71717a"} size={15} />
        {runDotColor && <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: runDotColor }} />}
      </Pressable>
    </View>
  );
}
