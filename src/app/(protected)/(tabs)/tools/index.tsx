import Icons, { type IconName } from "@/components/Icons";
import SafeAreaView from "@/components/SafeAreaView";
import Text from "@/components/Text";
import { useDeviceConnection } from "@/hooks/use-device-connection";
import { useRouter, type Href } from "expo-router";
import { Pressable, View } from "react-native";

type Tool = {
  icon: IconName;
  title: string;
  subtitle: string;
  route: Href;
};

const TOOLS: Tool[] = [
  {
    icon: "IconUpload",
    title: "Upload Firmware",
    subtitle: "Upload a compiled .bin file to the device",
    route: "/tools/upload-firmware",
  },
  {
    icon: "IconFolder",
    title: "File System",
    subtitle: "View and upload LittleFS/SPIFFS files",
    route: "/tools/filesystem",
  },
  {
    icon: "IconFileText",
    title: "Flash Log",
    subtitle: "View the logs generated during upload",
    route: "/tools/flash-log",
  },
  {
    icon: "IconCpu",
    title: "Chip Info & Partitions",
    subtitle: "View chip model, MAC address, and partitions",
    route: "/tools/chip-info",
  },
];

const DANGER_TOOL: Tool = {
  icon: "IconEraser",
  title: "Erase Chip",
  subtitle: "Permanently erases all data on the flash memory",
  route: "/tools/erase-chip",
};

export default function ToolsScreen() {
  const router = useRouter();
  const { connectionState, selectedDevice } = useDeviceConnection();
  const connected = connectionState === "connected";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-1 px-4 pt-2">
        <Text weight="bold" className="text-3xl text-primary">
          Tools
        </Text>
        <Text className="text-sm text-secondary">
          Flash, filesystem, and diagnostic tools for ESP32
        </Text>
      </View>

      <View className="mt-4 flex-row items-center gap-2 px-4">
        <View className={`h-[7px] w-[7px] rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-700"}`} />
        <Text className="text-xs text-zinc-500">
          {connected ? `Connected — ${selectedDevice?.driverType ?? "device"}` : "Device not connected"}
        </Text>
      </View>

      <View className="mt-4 gap-2 px-4">
        {TOOLS.map((tool) => (
          <ToolRow
            key={tool.title}
            tool={tool}
            onPress={() => router.push(tool.route)}
          />
        ))}
      </View>

      <View className="mt-6 gap-2 px-4">
        <Text
          weight="semibold"
          className="text-xs uppercase tracking-wide text-zinc-600"
        >
          Danger Zone
        </Text>
        <ToolRow
          tool={DANGER_TOOL}
          danger
          onPress={() => router.push(DANGER_TOOL.route)}
        />
      </View>
    </SafeAreaView>
  );
}

function ToolRow({
  tool,
  danger,
  onPress,
}: {
  tool: Tool;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-xl border p-4 ${
        danger
          ? "border-red-900/50 bg-[#1A1213]"
          : "border-[#2A3239] bg-[#12181D]"
      }`}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-xl ${danger ? "bg-red-950/60" : "bg-[#1A1B3A]"}`}
      >
        <Icons
          name={tool.icon}
          color={danger ? "#f87171" : "#8F8EFC"}
          size={20}
        />
      </View>
      <View className="flex-1 gap-0.5">
        <Text
          weight="bold"
          className={danger ? "text-red-400" : "text-primary"}
        >
          {tool.title}
        </Text>
        <Text className="text-xs text-secondary">{tool.subtitle}</Text>
      </View>
      <Icons name="IconChevronRight" color="#3f3f46" size={18} />
    </Pressable>
  );
}
