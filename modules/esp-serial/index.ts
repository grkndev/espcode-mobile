import { Platform } from "react-native";

import type { EspSerialModuleEvents, UsbDeviceInfo } from "./src/EspSerial.types";

export * from "./src/EspSerial.types";

export const isEspSerialSupported = Platform.OS === "android";

type NativeEspSerialModule = typeof import("./src/EspSerialModule").default;

let native: NativeEspSerialModule | null = null;

function getNative(): NativeEspSerialModule {
  if (!isEspSerialSupported) {
    throw new Error("USB serial is only supported on Android");
  }
  if (!native) {
    native = require("./src/EspSerialModule").default;
  }
  return native!;
}

export function listDevices(): Promise<UsbDeviceInfo[]> {
  if (!isEspSerialSupported) return Promise.resolve([]);
  return getNative().listDevices();
}

export function requestPermission(deviceId: number): Promise<boolean> {
  return getNative().requestPermission(deviceId);
}

export function open(deviceId: number, baudRate: number): Promise<void> {
  return getNative().open(deviceId, baudRate);
}

export function close(): Promise<void> {
  if (!isEspSerialSupported || !native) return Promise.resolve();
  return getNative().close();
}

export function write(bytes: Uint8Array): Promise<void> {
  return getNative().write(bytes);
}

export function setBaudRate(rate: number): Promise<void> {
  return getNative().setBaudRate(rate);
}

export function setControlLines(dtr: boolean, rts: boolean): Promise<void> {
  return getNative().setControlLines(dtr, rts);
}

export function addListener<K extends keyof EspSerialModuleEvents>(
  eventName: K,
  listener: EspSerialModuleEvents[K],
): { remove: () => void } {
  if (!isEspSerialSupported) {
    return { remove: () => {} };
  }
  return getNative().addListener(eventName, listener as never);
}
