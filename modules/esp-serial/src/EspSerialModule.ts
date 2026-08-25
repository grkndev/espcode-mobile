import { NativeModule, requireNativeModule } from "expo";

import { EspSerialModuleEvents, UsbDeviceInfo } from "./EspSerial.types";

declare class EspSerialModule extends NativeModule<EspSerialModuleEvents> {
  listDevices(): Promise<UsbDeviceInfo[]>;
  requestPermission(deviceId: number): Promise<boolean>;
  open(deviceId: number, baudRate: number): Promise<void>;
  close(): Promise<void>;
  write(bytes: Uint8Array): Promise<void>;
  setBaudRate(rate: number): Promise<void>;
  setControlLines(dtr: boolean, rts: boolean): Promise<void>;
}

export default requireNativeModule<EspSerialModule>("EspSerial");
