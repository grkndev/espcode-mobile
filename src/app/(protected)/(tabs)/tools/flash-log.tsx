import Icons from "@/components/Icons";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useFlashLog } from "@/hooks/use-flash-log";
import { FlatList, Pressable, View } from "react-native";

function lineColor(line: string) {
  if (/error|failed|timed out/i.test(line)) return "text-red-400";
  if (/warn/i.test(line)) return "text-amber-400";
  return "text-zinc-300";
}

function FlashLogBody() {
  const { sessions, selectedId, setSelectedId, selected } = useFlashLog();

  if (sessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-element">
          <Icons name="IconFileText" color="#71717a" size={28} />
        </View>
        <Text weight="bold" className="text-center text-lg text-primary">
          No uploads yet
        </Text>
        <Text className="text-center text-sm text-secondary">
          Firmware upload sessions will show up here once you run one.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View style={{ height: 100 }}>
        <FlatList
          horizontal
          data={sessions}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="items-start gap-2 px-4 pt-4"
          renderItem={({ item }) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                onPress={() => setSelectedId(item.id)}
                className={`gap-1 rounded-xl border p-3 ${
                  active ? "border-purple-700 bg-purple-700/10" : "border-[#2A3239] bg-[#12181D]"
                }`}
                style={{ width: 160 }}
              >
                <View className="flex-row items-center justify-between">
                  <Icons
                    name={item.success ? "IconCircleCheckFilled" : "IconAlertTriangleFilled"}
                    color={item.success ? "#34d399" : "#f87171"}
                    size={16}
                  />
                  <Text className="text-[10px] text-zinc-600">{item.duration}</Text>
                </View>
                <Text weight="semibold" className="text-xs text-primary" numberOfLines={1}>
                  {item.file}
                </Text>
                <Text className="text-[10px] text-secondary">{item.date}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <View className="mx-4 mt-4 h-px bg-zinc-800" />

      {selected && (
        <FlatList
          data={selected.lines}
          keyExtractor={(_, i) => `${selected.id}-${i}`}
          contentContainerClassName="p-4"
          className="flex-1"
          renderItem={({ item }) => (
            <Text style={{ fontFamily: Fonts?.mono }} className={`py-[3px] text-[13px] ${lineColor(item)}`}>
              {item}
            </Text>
          )}
        />
      )}
    </View>
  );
}

export default function FlashLogScreen() {
  return (
    <ToolScreenModal title="Flash Log">
      <FlashLogBody />
    </ToolScreenModal>
  );
}
