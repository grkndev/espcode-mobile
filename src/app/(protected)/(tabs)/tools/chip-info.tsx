import Icons from "@/components/Icons";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

const CHIP_INFO = [
  { label: "Chip", value: "ESP32-S3 (QFN56)" },
  { label: "Revision", value: "v0.2" },
  { label: "MAC Address", value: "7C:9E:BD:12:3A:44" },
  { label: "Flash Size", value: "8 MB" },
  { label: "Flash Mode", value: "DIO, 80MHz" },
  { label: "Crystal", value: "40MHz" },
  { label: "Features", value: "WiFi, BLE" },
];

const PARTITIONS = [
  { name: "nvs", type: "data", offset: "0x9000", size: "24 KB" },
  { name: "otadata", type: "data", offset: "0xf000", size: "8 KB" },
  { name: "app0", type: "app", offset: "0x10000", size: "1.5 MB" },
  { name: "app1", type: "app", offset: "0x190000", size: "1.5 MB" },
  { name: "spiffs", type: "data", offset: "0x310000", size: "5 MB" },
];

function ChipInfoBody() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pt-4 pb-10">
      <View className="flex-row items-center justify-between">
        <Text weight="semibold" className="text-xs uppercase tracking-wide text-zinc-600">
          Chip Info
        </Text>
        <Pressable onPress={refresh} className="flex-row items-center gap-1 rounded-lg bg-element px-3 py-1.5">
          <Icons name="IconRefresh" color="#B0B4BA" size={14} />
          <Text className="text-xs text-secondary">{refreshing ? "Reading..." : "Refresh"}</Text>
        </Pressable>
      </View>

      <View className="rounded-xl border border-[#2A3239] bg-[#12181D] p-4">
        {CHIP_INFO.map((row, i) => (
          <View key={row.label}>
            <View className="flex-row items-center justify-between py-2.5">
              <Text className="text-secondary">{row.label}</Text>
              <Text weight="semibold" className="text-primary">
                {row.value}
              </Text>
            </View>
            {i < CHIP_INFO.length - 1 && <View className="h-px bg-zinc-800" />}
          </View>
        ))}
      </View>

      <Text weight="semibold" className="text-xs uppercase tracking-wide text-zinc-600">
        Partition Table
      </Text>

      <View className="overflow-hidden rounded-xl border border-[#2A3239] bg-[#12181D]">
        <View className="flex-row bg-element px-3 py-2">
          <Text style={{ fontFamily: Fonts?.mono }} className="w-[26%] text-[11px] text-zinc-500">
            NAME
          </Text>
          <Text style={{ fontFamily: Fonts?.mono }} className="w-[20%] text-[11px] text-zinc-500">
            TYPE
          </Text>
          <Text style={{ fontFamily: Fonts?.mono }} className="w-[28%] text-[11px] text-zinc-500">
            OFFSET
          </Text>
          <Text style={{ fontFamily: Fonts?.mono }} className="w-[26%] text-right text-[11px] text-zinc-500">
            SIZE
          </Text>
        </View>
        {PARTITIONS.map((p, i) => (
          <View key={p.name} className={`flex-row px-3 py-2.5 ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
            <Text style={{ fontFamily: Fonts?.mono }} className="w-[26%] text-[12px] text-primary">
              {p.name}
            </Text>
            <Text style={{ fontFamily: Fonts?.mono }} className="w-[20%] text-[12px] text-purple-400">
              {p.type}
            </Text>
            <Text style={{ fontFamily: Fonts?.mono }} className="w-[28%] text-[12px] text-zinc-400">
              {p.offset}
            </Text>
            <Text style={{ fontFamily: Fonts?.mono }} className="w-[26%] text-right text-[12px] text-zinc-400">
              {p.size}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function ChipInfoScreen() {
  return (
    <ToolScreenModal title="Chip Info & Partitions">
      <ChipInfoBody />
    </ToolScreenModal>
  );
}
