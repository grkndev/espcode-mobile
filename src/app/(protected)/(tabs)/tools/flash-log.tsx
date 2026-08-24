import Icons from "@/components/Icons";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";

type Session = {
  id: string;
  date: string;
  file: string;
  duration: string;
  success: boolean;
  lines: string[];
};

const SESSIONS: Session[] = [
  {
    id: "1",
    date: "Today, 14:32",
    file: "firmware-v1.2.0.bin",
    duration: "18s",
    success: true,
    lines: [
      "esptool.js v0.6.0",
      "Connecting...",
      "Chip is ESP32-S3 (QFN56) (revision v0.2)",
      "Uploading stub...",
      "Running stub...",
      "Changing baud rate to 460800",
      "Configuring flash size...",
      "Writing at 0x00010000... (100%)",
      "Wrote 1,468,928 bytes in 16.4s",
      "Hash of data verified.",
      "Hard resetting via RTS pin...",
    ],
  },
  {
    id: "2",
    date: "Yesterday, 09:15",
    file: "firmware-v1.1.3.bin",
    duration: "21s",
    success: true,
    lines: [
      "esptool.js v0.6.0",
      "Connecting...",
      "Chip is ESP32-S3",
      "Writing at 0x00010000... (100%)",
      "Hard resetting via RTS pin...",
    ],
  },
  {
    id: "3",
    date: "2 days ago, 19:47",
    file: "firmware-v1.1.0.bin",
    duration: "6s",
    success: false,
    lines: [
      "esptool.js v0.6.0",
      "Connecting...",
      "A fatal error occurred: Failed to connect to ESP32-S3: Timed out waiting for packet header",
    ],
  },
];

function lineColor(line: string) {
  if (/error|failed|timed out/i.test(line)) return "text-red-400";
  if (/warn/i.test(line)) return "text-amber-400";
  return "text-zinc-300";
}

function FlashLogBody() {
  const [selectedId, setSelectedId] = useState(SESSIONS[0].id);
  const selected = SESSIONS.find((s) => s.id === selectedId) ?? SESSIONS[0];

  return (
    <View className="flex-1">
      <View style={{ height: 100 }}>
        <FlatList
          horizontal
          data={SESSIONS}
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
