import Icons from "@/components/Icons";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useChipInfo } from "@/hooks/use-chip-info";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

function ChipInfoBody() {
  const { status, error, chipInfo, partitions, refresh } = useChipInfo();

  useEffect(() => {
    refresh();
  }, []);

  const reading = status === "reading";

  const rows = chipInfo
    ? [
        { label: "Chip", value: chipInfo.chip },
        { label: "MAC Address", value: chipInfo.macAddress },
        { label: "Flash Size", value: chipInfo.flashSize },
        { label: "Crystal", value: chipInfo.crystalFreq },
        { label: "Features", value: chipInfo.features },
      ]
    : [];

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pt-4 pb-10">
      <View className="flex-row items-center justify-between">
        <Text weight="semibold" className="text-xs uppercase tracking-wide text-zinc-600">
          Chip Info
        </Text>
        <Pressable
          onPress={refresh}
          disabled={reading}
          className="flex-row items-center gap-1 rounded-lg bg-element px-3 py-1.5"
        >
          {reading ? (
            <ActivityIndicator size="small" color="#B0B4BA" />
          ) : (
            <Icons name="IconRefresh" color="#B0B4BA" size={14} />
          )}
          <Text className="text-xs text-secondary">{reading ? "Reading..." : "Refresh"}</Text>
        </Pressable>
      </View>

      {status === "error" && (
        <View className="items-center gap-2 rounded-xl border border-red-900/50 bg-[#1A1213] p-6">
          <Icons name="IconAlertTriangleFilled" color="#f87171" size={24} />
          <Text weight="bold" className="text-center text-primary">
            Couldn&apos;t read chip
          </Text>
          <Text className="text-center text-xs text-secondary">{error}</Text>
        </View>
      )}

      {status === "idle" && !chipInfo && (
        <View className="items-center gap-2 rounded-xl border border-[#2A3239] bg-[#12181D] p-6">
          <ActivityIndicator size="small" color="#B0B4BA" />
        </View>
      )}

      {chipInfo && (
        <>
          <View className="rounded-xl border border-[#2A3239] bg-[#12181D] p-4">
            {rows.map((row, i) => (
              <View key={row.label}>
                <View className="flex-row items-start justify-between gap-3 py-2.5">
                  <Text className="text-secondary">{row.label}</Text>
                  <Text weight="semibold" className="flex-1 text-right text-primary">
                    {row.value}
                  </Text>
                </View>
                {i < rows.length - 1 && <View className="h-px bg-zinc-800" />}
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
            {partitions.map((p, i) => (
              <View key={`${p.name}-${p.offset}`} className={`flex-row px-3 py-2.5 ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
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
        </>
      )}
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
