import type { UsbDeviceInfo } from "@/modules/esp-serial";
import type { ConnectionMode, ConnectionState } from "@/providers/device-connection-provider";
import { ReadableStream, WritableStream } from "web-streams-polyfill";

export type EspSerialPortDeps = {
  connectionState: ConnectionState;
  selectedDevice: UsbDeviceInfo | null;
  connect: (baudRate: number) => Promise<UsbDeviceInfo>;
  setBaudRate: (rate: number) => void;
  setControlLines: (dtr: boolean, rts: boolean) => Promise<void>;
  setMode: (mode: ConnectionMode) => void;
  write: (bytes: Uint8Array) => Promise<void>;
  subscribeRaw: (onData: (bytes: Uint8Array) => void) => () => void;
};

/**
 * Shims the shape esptool-js's `Transport` expects from a Web Serial
 * `SerialPort`, backed by the app's single `DeviceConnectionProvider`
 * connection instead of a browser. `open`/`close` are deliberately "soft":
 * `Transport` calls them repeatedly during normal operation (e.g.
 * `ESPLoader.changeBaud()` disconnects/reconnects mid-flash just to switch
 * baud rates), not only once at the start/end, so these adjust the
 * existing native connection rather than tearing down and re-establishing
 * real USB I/O each time.
 */
export class EspSerialPort {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
  private unsubscribeRaw: (() => void) | null = null;
  // Own field, not React state: esptool-js reads getInfo() (for its PID-based
  // reset-strategy auto-detection) immediately after open() resolves, before
  // the setSelectedDevice() call inside connect() has necessarily propagated
  // through a React re-render. This is set synchronously the moment we know
  // the device, sidestepping that timing gap entirely.
  private connectedDevice: UsbDeviceInfo | null = null;

  // Takes a getter rather than a fixed deps object: this instance is
  // created once and lives for the whole esptool-js operation, but
  // `connectionState`/`selectedDevice` change constantly during that
  // operation (Transport itself calls open()/close() repeatedly, e.g. for
  // baud changes) - each call must see current provider state, not a
  // snapshot from whenever the shim happened to be constructed.
  constructor(private readonly getDeps: () => EspSerialPortDeps) {
    this.readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.unsubscribeRaw = this.getDeps().subscribeRaw((bytes) => controller.enqueue(bytes));
      },
      cancel: () => {
        this.unsubscribeRaw?.();
        this.unsubscribeRaw = null;
      },
    });

    this.writable = new WritableStream<Uint8Array>({
      write: (chunk) => this.getDeps().write(chunk),
    });
  }

  async open({ baudRate }: { baudRate?: number }): Promise<void> {
    const deps = this.getDeps();
    const baud = baudRate ?? 115200;
    deps.setMode("esptool");
    if (deps.connectionState !== "connected") {
      this.connectedDevice = await deps.connect(baud);
    } else {
      deps.setBaudRate(baud);
      this.connectedDevice = deps.selectedDevice;
    }
  }

  async close(): Promise<void> {
    // Deliberate no-op - see class doc comment above.
  }

  async setSignals({
    dataTerminalReady,
    requestToSend,
  }: {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
  }): Promise<void> {
    await this.getDeps().setControlLines(dataTerminalReady ?? false, requestToSend ?? false);
  }

  getInfo(): { usbVendorId?: number; usbProductId?: number } {
    const device = this.connectedDevice ?? this.getDeps().selectedDevice;
    return {
      usbVendorId: device?.vendorId,
      usbProductId: device?.productId,
    };
  }
}
