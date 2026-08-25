import SafeAreaView from "@/components/SafeAreaView";
import Text from "@/components/Text";
import * as EspSerial from "@/modules/esp-serial";
import type { UsbDeviceInfo } from "@/modules/esp-serial";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function toAscii(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
    .join("");
}

export default function UsbDebugScreen() {
  const [devices, setDevices] = useState<UsbDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const appendLog = (line: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString("en-GB", { hour12: false })} ${line}`]);
  };

  useEffect(() => {
    const dataSub = EspSerial.addListener("onData", (event) => {
      appendLog(`RX hex: ${toHex(event.bytes)}`);
      appendLog(`RX txt: ${toAscii(event.bytes)}`);
    });
    const errorSub = EspSerial.addListener("onError", (event) => {
      appendLog(`ERROR: ${event.message}`);
    });
    const attachSub = EspSerial.addListener("onDeviceAttached", (device) => {
      appendLog(`ATTACHED: ${device.driverType} (id ${device.id})`);
    });
    const detachSub = EspSerial.addListener("onDeviceDetached", (event) => {
      appendLog(`DETACHED: id ${event.id} (wasConnected: ${event.wasConnected})`);
    });
    return () => {
      dataSub.remove();
      errorSub.remove();
      attachSub.remove();
      detachSub.remove();
    };
  }, []);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(true);
    try {
      appendLog(`${label}...`);
      await fn();
      appendLog(`${label} OK`);
    } catch (e) {
      appendLog(`${label} FAILED: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const scan = () =>
    run("scan", async () => {
      const found = await EspSerial.listDevices();
      setDevices(found);
      appendLog(`found ${found.length} device(s)`);
      if (found.length > 0 && selectedId === null) setSelectedId(found[0].id);
    });

  const requestPermission = () =>
    run("requestPermission", async () => {
      if (selectedId === null) throw new Error("no device selected");
      const granted = await EspSerial.requestPermission(selectedId);
      appendLog(`permission granted: ${granted}`);
    });

  const open = () =>
    run("open @115200", async () => {
      if (selectedId === null) throw new Error("no device selected");
      await EspSerial.open(selectedId, 115200);
    });

  const write = () =>
    run("write", async () => {
      const bytes = new TextEncoder().encode("AT\r\n");
      await EspSerial.write(bytes);
    });

  const close = () => run("close", () => EspSerial.close());

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="gap-1 px-4 pt-2">
        <Text weight="bold" className="text-xl text-primary">
          USB Debug
        </Text>
        <Text className="text-xs text-secondary">
          {EspSerial.isEspSerialSupported ? "esp-serial supported" : "esp-serial NOT supported on this platform"}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2 px-4 pt-3">
        <DebugButton label="Scan" onPress={scan} disabled={busy} />
        <DebugButton label="Request Permission" onPress={requestPermission} disabled={busy || selectedId === null} />
        <DebugButton label="Open" onPress={open} disabled={busy || selectedId === null} />
        <DebugButton label="Write AT" onPress={write} disabled={busy} />
        <DebugButton label="Close" onPress={close} disabled={busy} />
        <DebugButton label="Clear Log" onPress={() => setLog([])} disabled={busy} />
      </View>

      <View className="gap-1 px-4 pt-3">
        <Text weight="semibold" className="text-xs uppercase tracking-wide text-zinc-600">
          Devices
        </Text>
        {devices.length === 0 && <Text className="text-xs text-secondary">No devices scanned yet</Text>}
        {devices.map((d) => (
          <Pressable key={d.id} onPress={() => setSelectedId(d.id)} className="flex-row items-center gap-2 py-1">
            <View
              className={`h-2 w-2 rounded-full ${selectedId === d.id ? "bg-purple-500" : "bg-zinc-700"}`}
            />
            <Text className="text-xs text-primary">
              {d.driverType} — id {d.id} — {d.vendorId.toString(16)}:{d.productId.toString(16)} — {d.deviceName}
            </Text>
          </Pressable>
        ))}
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

function DebugButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 ${disabled ? "bg-element" : "bg-purple-700"}`}
    >
      <Text weight="semibold" className={`text-xs ${disabled ? "text-zinc-600" : "text-white"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
