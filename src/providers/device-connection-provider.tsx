import * as EspSerial from "@/modules/esp-serial";
import type { UsbDeviceInfo } from "@/modules/esp-serial";
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
export type ConnectionMode = "idle" | "monitor" | "esptool";

export type DeviceConnectionContextValue = {
  devices: UsbDeviceInfo[];
  selectedDevice: UsbDeviceInfo | null;
  connectionState: ConnectionState;
  connectionError: string | null;
  baudRate: number;
  mode: ConnectionMode;
  scanDevices: () => Promise<UsbDeviceInfo[]>;
  selectAndConnect: (deviceId: number, baudRate: number) => Promise<void>;
  disconnect: () => void;
  setBaudRate: (rate: number) => void;
  setMode: (mode: ConnectionMode) => void;
  write: (bytes: Uint8Array) => void;
  subscribeRaw: (onData: (bytes: Uint8Array) => void) => () => void;
};

export const DeviceConnectionContext = createContext<DeviceConnectionContextValue | null>(null);

const DEFAULT_BAUD_RATE = 115200;

export function DeviceConnectionProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<UsbDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<UsbDeviceInfo | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [baudRate, setBaudRateState] = useState(DEFAULT_BAUD_RATE);
  const [mode, setModeState] = useState<ConnectionMode>("idle");
  const rawListenersRef = useRef<Set<(bytes: Uint8Array) => void>>(new Set());

  useEffect(() => {
    const dataSub = EspSerial.addListener("onData", (event) => {
      rawListenersRef.current.forEach((listener) => listener(event.bytes));
    });
    const detachSub = EspSerial.addListener("onDeviceDetached", (event) => {
      if (!event.wasConnected) return;
      setConnectionState("disconnected");
      setConnectionError("Device disconnected");
      setSelectedDevice(null);
      setModeState("idle");
    });
    return () => {
      dataSub.remove();
      detachSub.remove();
      EspSerial.close().catch(() => {});
    };
  }, []);

  const scanDevices = useCallback(async () => {
    const found = await EspSerial.listDevices();
    setDevices(found);
    return found;
  }, []);

  const selectAndConnect = useCallback(
    async (deviceId: number, baud: number) => {
      setConnectionState("connecting");
      setConnectionError(null);
      try {
        const granted = await EspSerial.requestPermission(deviceId);
        if (!granted) {
          setConnectionState("error");
          setConnectionError("Permission denied");
          return;
        }
        await EspSerial.open(deviceId, baud);
        setSelectedDevice(devices.find((d) => d.id === deviceId) ?? null);
        setBaudRateState(baud);
        setConnectionState("connected");
      } catch (e) {
        setConnectionState("error");
        setConnectionError(e instanceof Error ? e.message : String(e));
      }
    },
    [devices],
  );

  const disconnect = useCallback(() => {
    EspSerial.close().catch(() => {});
    setConnectionState("disconnected");
    setSelectedDevice(null);
    setConnectionError(null);
    setModeState("idle");
  }, []);

  const setBaudRate = useCallback(
    (rate: number) => {
      setBaudRateState(rate);
      if (connectionState === "connected") {
        EspSerial.setBaudRate(rate).catch((e) => {
          setConnectionError(e instanceof Error ? e.message : String(e));
        });
      }
    },
    [connectionState],
  );

  const setMode = useCallback((next: ConnectionMode) => setModeState(next), []);

  const write = useCallback((bytes: Uint8Array) => {
    EspSerial.write(bytes).catch((e) => {
      setConnectionError(e instanceof Error ? e.message : String(e));
    });
  }, []);

  const subscribeRaw = useCallback((onData: (bytes: Uint8Array) => void) => {
    rawListenersRef.current.add(onData);
    return () => {
      rawListenersRef.current.delete(onData);
    };
  }, []);

  const value = useMemo<DeviceConnectionContextValue>(
    () => ({
      devices,
      selectedDevice,
      connectionState,
      connectionError,
      baudRate,
      mode,
      scanDevices,
      selectAndConnect,
      disconnect,
      setBaudRate,
      setMode,
      write,
      subscribeRaw,
    }),
    [
      devices,
      selectedDevice,
      connectionState,
      connectionError,
      baudRate,
      mode,
      scanDevices,
      selectAndConnect,
      disconnect,
      setBaudRate,
      setMode,
      write,
      subscribeRaw,
    ],
  );

  return <DeviceConnectionContext.Provider value={value}>{children}</DeviceConnectionContext.Provider>;
}
