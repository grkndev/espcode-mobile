import * as EspSerial from "@/modules/esp-serial";
import type { UsbDeviceInfo } from "@/modules/esp-serial";
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
export type ConnectionMode = "idle" | "monitor" | "esptool";

export type DeviceConnectionContextValue = {
  selectedDevice: UsbDeviceInfo | null;
  connectionState: ConnectionState;
  connectionError: string | null;
  baudRate: number;
  mode: ConnectionMode;
  /** Scans, auto-selects the first USB-serial device found, requests permission, and opens it. */
  connect: (baudRate: number) => Promise<UsbDeviceInfo>;
  disconnect: () => void;
  setBaudRate: (rate: number) => void;
  setControlLines: (dtr: boolean, rts: boolean) => Promise<void>;
  setMode: (mode: ConnectionMode) => void;
  write: (bytes: Uint8Array) => Promise<void>;
  subscribeRaw: (onData: (bytes: Uint8Array) => void) => () => void;
};

export const DeviceConnectionContext = createContext<DeviceConnectionContextValue | null>(null);

const DEFAULT_BAUD_RATE = 115200;

export function DeviceConnectionProvider({ children }: { children: ReactNode }) {
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

  // No device-picker UI: the board connects directly over one USB-C cable, so
  // the only device found (if any) is the one the user means. A picker only
  // matters for a multi-device/hub setup, which isn't this app's real usage
  // today - revisit with a non-modal picker (e.g. its own screen) if that
  // ever changes, rather than a BottomSheetModal in this hot connect path.
  // Returns the connected device directly rather than relying on callers to
  // read it back from `selectedDevice`: that's React state set via
  // setSelectedDevice() below, which doesn't apply synchronously. A caller
  // that needs the device immediately after connect() resolves (e.g.
  // esptool-js's chip-detection reset logic, which calls transport.getPid()
  // right after transport.connect() returns) could otherwise see a stale
  // value from before this render commits.
  const connect = useCallback(async (baud: number): Promise<UsbDeviceInfo> => {
    setConnectionState("connecting");
    setConnectionError(null);
    try {
      const found = await EspSerial.listDevices();
      const target = found[0];
      if (!target) {
        throw new Error("No device found");
      }
      const granted = await EspSerial.requestPermission(target.id);
      if (!granted) {
        throw new Error("Permission denied");
      }
      await EspSerial.open(target.id, baud);
      setSelectedDevice(target);
      setBaudRateState(baud);
      setConnectionState("connected");
      return target;
    } catch (e) {
      setConnectionState("error");
      setConnectionError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }, []);

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
    return EspSerial.write(bytes).catch((e) => {
      setConnectionError(e instanceof Error ? e.message : String(e));
      throw e;
    });
  }, []);

  const setControlLines = useCallback((dtr: boolean, rts: boolean) => {
    return EspSerial.setControlLines(dtr, rts).catch((e) => {
      setConnectionError(e instanceof Error ? e.message : String(e));
      throw e;
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
      selectedDevice,
      connectionState,
      connectionError,
      baudRate,
      mode,
      connect,
      disconnect,
      setBaudRate,
      setControlLines,
      setMode,
      write,
      subscribeRaw,
    }),
    [
      selectedDevice,
      connectionState,
      connectionError,
      baudRate,
      mode,
      connect,
      disconnect,
      setBaudRate,
      setControlLines,
      setMode,
      write,
      subscribeRaw,
    ],
  );

  return <DeviceConnectionContext.Provider value={value}>{children}</DeviceConnectionContext.Provider>;
}
