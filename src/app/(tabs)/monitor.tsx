import Icons, { type IconName } from "@/components/Icons";
import SafeAreaView from "@/components/SafeAreaView";
import Text from "@/components/Text";
import { Fonts } from "@/constants/theme";
import { useRef, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

type Tab = "monitor" | "plotter";
type LogLevel = "info" | "warn" | "error" | "system";

type LogLine = {
  id: string;
  time: string;
  level: LogLevel;
  text: string;
};

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: "text-zinc-200",
  warn: "text-amber-400",
  error: "text-red-400",
  system: "text-purple-400",
};

const LINE_ENDINGS = ["LF", "CR", "CRLF", "None"];

const BAUD_RATES = [9600, 19200, 38400, 57600, 74880, 115200, 230400];

const INITIAL_LOGS: LogLine[] = [
  {
    id: "1",
    time: "13:42:01.221",
    level: "info",
    text: "Temp: 24.6C  Hum: 41%",
  },
  {
    id: "2",
    time: "13:42:01.724",
    level: "info",
    text: "Temp: 24.7C  Hum: 41%",
  },
  {
    id: "3",
    time: "13:42:02.221",
    level: "info",
    text: "Temp: 24.7C  Hum: 40%",
  },
  {
    id: "4",
    time: "13:42:02.723",
    level: "info",
    text: "Temp: 24.8C  Hum: 40%",
  },
  {
    id: "5",
    time: "13:42:03.221",
    level: "info",
    text: "Temp: 24.8C  Hum: 41%",
  },
  {
    id: "6",
    time: "13:42:03.724",
    level: "info",
    text: "Temp: 24.9C  Hum: 41%",
  },
];

export default function MonitorScreen() {
  const [tab, setTab] = useState<Tab>("monitor");
  const [connected, setConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(115200);
  const [baudModalVisible, setBaudModalVisible] = useState(false);
  const [lineEnding, setLineEnding] = useState(0);
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<LogLine[]>(INITIAL_LOGS);
  const listRef = useRef<FlatList<LogLine>>(null);

  const handleSend = () => {
    const text = command.trim();
    if (!text || !connected) return;
    setLogs((prev) => [
      ...prev,
      {
        id: `cmd-${prev.length}-${text.length}`,
        time: `${new Date().toLocaleTimeString("en-GB", { hour12: false })}.000`,
        level: "system",
        text: `> ${text}`,
      },
    ]);
    setCommand("");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-6">
            <TabButton
              label="Monitor"
              active={tab === "monitor"}
              onPress={() => setTab("monitor")}
            />
            <TabButton
              label="Plotter"
              active={tab === "plotter"}
              onPress={() => setTab("plotter")}
            />
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setBaudModalVisible(true)}
              className="flex-row items-center gap-1 rounded-xl bg-element px-3 py-2"
            >
              <Text weight="semibold" className="text-primary text-sm">
                {baudRate}
              </Text>
              <Icons name="IconChevronDown" color="#B0B4BA" size={16} />
            </Pressable>
            <Pressable
              onPress={() => setConnected((v) => !v)}
              className="rounded-xl bg-purple-700 px-5 py-2"
            >
              <Text weight="bold" className="text-white text-sm">
                {connected ? "Pause" : "Start"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="mt-3 h-px bg-zinc-800" />

      {tab === "monitor" && (
        <>
          <View className="flex-row items-center gap-1.5 px-4 pt-2">
            <TextInput
              value={command}
              onChangeText={setCommand}
              onSubmitEditing={handleSend}
              placeholder="Send to the chip..."
              placeholderTextColor="#60646c"
              returnKeyType="send"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 rounded-lg bg-element px-3 py-1.5 text-sm text-primary"
              style={{ color: "#ffffff" }}
            />
            <Pressable
              onPress={() =>
                setLineEnding((i) => (i + 1) % LINE_ENDINGS.length)
              }
              className="rounded-lg bg-element px-3 py-2"
            >
              <Text className="text-xs text-secondary">
                {LINE_ENDINGS[lineEnding]}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSend}
              disabled={!command.trim() || !connected}
              className={`rounded-lg p-2 ${command.trim() && connected ? "bg-purple-700" : "bg-element"}`}
            >
              <Icons
                name="IconSend2"
                color={command.trim() && connected ? "#ffffff" : "#52525b"}
                size={16}
              />
            </Pressable>
            <Pressable
              onPress={() => setLogs([])}
              disabled={logs.length === 0}
              className="rounded-lg p-2"
            >
              <Icons
                name="IconTrash"
                color={logs.length === 0 ? "#3f3f46" : "#71717a"}
                size={16}
              />
            </Pressable>
          </View>

          <View className="flex-1 pt-3">
            {connected ? (
              <ConsoleView logs={logs} listRef={listRef} />
            ) : (
              <EmptyState
                icon="IconPlugConnectedX"
                title="Not Connected yet"
                subtitle="Press the Start button to view the logs"
              />
            )}
          </View>
        </>
      )}

      {tab === "plotter" && (
        <View className="flex-1 px-4 pt-3">
          {connected ? (
            <PlotterView />
          ) : (
            <EmptyState
              icon="IconChartDots2"
              title="No data available yet"
              subtitle="Press Start to plot the numerical values coming in through the serial port."
            />
          )}
        </View>
      )}

      <BaudRateModal
        visible={baudModalVisible}
        value={baudRate}
        onSelect={setBaudRate}
        onClose={() => setBaudModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`pb-2 px-3 ${active ? "border-b-2 border-purple-600" : ""}`}
    >
      <Text
        weight={active ? "bold" : "regular"}
        className={active ? "text-primary" : "text-secondary"}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ConsoleView({
  logs,
  listRef,
}: {
  logs: LogLine[];
  listRef: React.RefObject<FlatList<LogLine> | null>;
}) {
  return (
    <FlatList
      ref={listRef}
      data={logs}
      keyExtractor={(item) => item.id}
      onContentSizeChange={() =>
        listRef.current?.scrollToEnd({ animated: true })
      }
      renderItem={({ item }) => (
        <View className="flex-row gap-3 py-1">
          <Text
            style={{ fontFamily: Fonts?.mono }}
            className="text-[13px] text-zinc-600"
          >
            {item.time}
          </Text>
          <Text
            style={{ fontFamily: Fonts?.mono }}
            className={`flex-1 text-[13px] ${LEVEL_COLOR[item.level]}`}
          >
            {item.text}
          </Text>
        </View>
      )}
      contentContainerClassName="px-4 pb-4"
      className="flex-1"
    />
  );
}

function PlotterView() {
  return (
    <View className="flex-1 gap-3">
      <View className="flex-1">
        <Svg viewBox="0 0 300 120" width="100%" height="100%">
          <Line
            x1="0"
            y1="20"
            x2="300"
            y2="20"
            stroke="#27272a"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1="60"
            x2="300"
            y2="60"
            stroke="#27272a"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1="100"
            x2="300"
            y2="100"
            stroke="#27272a"
            strokeWidth="1"
          />
          <Path
            d="M0,90 L20,85 L40,92 L60,75 L80,80 L100,60 L120,65 L140,50 L160,58 L180,45 L200,55 L220,40 L240,48 L260,35 L280,42 L300,38"
            stroke="#9333ea"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M0,70 L20,75 L40,68 L60,72 L80,65 L100,70 L120,62 L140,68 L160,64 L180,70 L200,66 L220,72 L240,65 L260,69 L280,64 L300,67"
            stroke="#34d399"
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </View>
      <View className="flex-row gap-4 pb-4">
        <LegendItem color="#9333ea" label="temperature" />
        <LegendItem color="#34d399" label="humidity" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text className="text-xs text-secondary">{label}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-10">
      <Icons name={icon} color="#3f3f46" size={32} />
      <Text weight="bold" className="mt-1 text-center text-base text-primary">
        {title}
      </Text>
      <Text className="text-center text-sm text-secondary">{subtitle}</Text>
    </View>
  );
}

function BaudRateModal({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: number;
  onSelect: (rate: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-10"
        onPress={onClose}
      >
        <Pressable
          className="w-full rounded-2xl border border-[#2A3239] bg-[#12181D] p-2"
          onPress={(e) => e.stopPropagation()}
        >
          <Text weight="bold" className="px-3 pb-3 pt-2 text-primary">
            Baud Rate
          </Text>
          {BAUD_RATES.map((rate) => {
            const selected = rate === value;
            return (
              <Pressable
                key={rate}
                onPress={() => {
                  onSelect(rate);
                  onClose();
                }}
                className={`flex-row items-center justify-between rounded-xl px-3 py-3 ${
                  selected ? "bg-purple-700/15" : ""
                }`}
              >
                <Text
                  weight={selected ? "semibold" : "regular"}
                  className={selected ? "text-purple-400" : "text-primary"}
                >
                  {rate}
                </Text>
                {selected && (
                  <Icons name="IconCheck" color="#a855f7" size={18} />
                )}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
