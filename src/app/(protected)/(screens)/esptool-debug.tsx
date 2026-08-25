import SafeAreaView from "@/components/SafeAreaView";
import Text from "@/components/Text";
import { useDeviceConnection } from "@/hooks/use-device-connection";
import { useEspTransport } from "@/hooks/use-esp-transport";
import { ESPLoader } from "esptool-js";
import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function EsptoolDebugScreen() {
  const { connectionState, connectionError, selectedDevice } = useDeviceConnection();
  const transport = useEspTransport();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const busyRef = useRef(false);

  const appendLog = (line: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString("en-GB", { hour12: false })} ${line}`]);
  };

  const runMain = async () => {
    // A React-state-only guard can race on a fast double-tap (disabled=busy
    // only takes effect after the next render); this ref check is
    // synchronous, so a second tap before that render is a hard no-op. Two
    // concurrent main() calls would share the same Transport and collide on
    // its single ReadableStream ("already locked for exclusive reading").
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      appendLog("Constructing ESPLoader...");
      const loader = new ESPLoader({ transport, baudrate: 115200, debugLogging: true });
      appendLog("Calling main() (connect + sync + chip detect)...");
      const chipName = await loader.main();
      appendLog(`main() OK: ${chipName}`);
    } catch (e) {
      appendLog(`main() FAILED: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-1 px-4 pt-2">
        <Text weight="bold" className="text-xl text-primary">
          esptool-js Debug
        </Text>
        <Text className="text-xs text-secondary">
          connectionState: {connectionState} {connectionError ? `(${connectionError})` : ""}
        </Text>
        <Text className="text-xs text-secondary">
          device: {selectedDevice ? `${selectedDevice.driverType} (${selectedDevice.vendorId.toString(16)}:${selectedDevice.productId.toString(16)})` : "none"}
        </Text>
      </View>

      <View className="flex-row gap-2 px-4 pt-3">
        <Pressable
          onPress={runMain}
          disabled={busy}
          className={`rounded-lg px-4 py-2 ${busy ? "bg-element" : "bg-purple-700"}`}
        >
          <Text weight="semibold" className={`text-xs ${busy ? "text-zinc-600" : "text-white"}`}>
            {busy ? "Running..." : "Run main()"}
          </Text>
        </Pressable>
        <Pressable onPress={() => setLog([])} disabled={busy} className="rounded-lg bg-element px-4 py-2">
          <Text weight="semibold" className="text-xs text-secondary">
            Clear Log
          </Text>
        </Pressable>
      </View>

      <View className="mx-4 mt-3 h-px bg-zinc-800" />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-1 px-4 py-3"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {log.map((line, i) => (
          <Text key={i} className="text-[11px] text-zinc-400" style={{ fontFamily: "monospace" }}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
