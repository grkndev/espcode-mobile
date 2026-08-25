# ESP Device Connectivity Design

Date: 2026-08-25
Scope of this document: full roadmap (Phase 0–7) + detailed design for
**Phase 0 (native USB-serial foundation)** and **Phase 1 (Monitor screen goes
live)**. Later phases are sketched as a roadmap only and will get their own
design pass when their turn comes.

**2026-08-25 update — `DeviceSelectSheet` removed.** The Phase 1 section
below originally routed Start through a `BottomSheetModal` device picker.
On real hardware, that sheet's `.present()` started silently no-opping
after a connect/disconnect cycle — confirmed to be the sheet itself (touch
handling and every other control kept working) and not fixed by two
targeted attempts (decoupling the scan from its mount, and dismissing
before the async connect). Since this app's actual usage is one board over
one USB-C cable, there was never a real need to pick among devices, so the
picker was removed rather than debugged further: `DeviceConnectionProvider`
now exposes a single `connect(baudRate)` that scans, auto-selects the only
device found, requests permission, and opens it — no sheet in the loop.
The rest of this section is kept as-is for the reasoning trail; treat any
mention of `DeviceSelectSheet` as superseded by `connect()`.

## Purpose

The app is fully built as UI with mock/local-state data (Monitor, Tools
screens, Editor). This phase replaces the mock device layer with a real
connection to an ESP32/ESP8266 board over USB, starting with the Monitor
screen, so the rest of the app (Tools: Upload Firmware, Chip Info, Erase
Chip, File System) can be wired up incrementally on top of the same
foundation.

## Platform & transport

- **Android only** for now. iOS has no general USB-serial host model
  comparable to Android's `UsbManager`/USB Host API, so it's out of scope.
- **USB (Android USB Host / OTG)**, wired. This is how esptool actually
  works — it talks to the board's USB-serial bridge (CP2102/CH340/FTDI) or
  native USB (ESP32-S3/C3) over UART framing. Bluetooth and WiFi OTA are
  different mechanisms and don't apply to esptool's protocol.
- Test hardware: an Android phone with a data-capable USB-C↔USB-C cable,
  connected directly to a USB-C ESP32-S3 DevKitC-class board — no OTG
  adapter needed since both ends are USB-C and the phone negotiates host
  role natively.

## Roadmap

Each phase is validated on real hardware before moving to the next.

| Phase | Deliverable | Depends on |
|---|---|---|
| 0 | Native USB-serial Expo Module (Android, Kotlin) | — |
| 1 | Monitor screen live (this doc) | 0 |
| 2 | `esptool-js` integration layer (Transport adapter, no visible UI) | 0 |
| 3 | Chip Info & Partitions live (first esptool-js consumer, read-only) | 2 |
| 4 | Upload Firmware live (`write_flash`) | 2 |
| 5 | Erase Chip live (`erase_flash`) | 2 |
| 6 | Flash Log persists real sessions (AsyncStorage, replaces mock array) | 4, 5 |
| 7 | File System (LittleFS/SPIFFS) — **open design question** | — |

**Why esptool-js, not a hand-rolled Kotlin protocol port:** Espressif
maintains an official `esptool-js` npm package (used by ESP Web Tools /
esp-launchpad) that implements the entire esptool protocol (SLIP framing,
sync, stub-loader upload, flash read/write/erase, chip auto-detect, MD5
verify) in pure TypeScript. Its only platform dependency is a `Transport`
interface (write/read/setDTR/setRTS/connect/disconnect) normally backed by
the Web Serial API. We implement that same interface backed by our native
module instead, so the native side only needs to be a raw USB-serial pipe —
protocol correctness and chip-support updates stay upstream. (The
`flash-log.tsx` mock data already references `esptool.js v0.6.0` in its log
lines, confirming this was the intended direction from the start.)

**Why Phase 7 (File System) is flagged, not planned:** esptool has no
concept of individual files — only raw flash region read/write. Real
per-file listing/upload/delete needs the target firmware to speak a file
protocol over the same serial link (e.g. MicroPython's raw-REPL file
transfer), which is a different protocol from esptool-js and doesn't exist
for arbitrary Arduino/C++ firmware. This needs its own brainstorming pass
when we get there.

## Phase 0 — Native USB-serial foundation

### Module layout

```
modules/esp-serial/
├── expo-module.config.json
├── android/
│   ├── build.gradle                    — usb-serial-for-android (JitPack)
│   └── src/main/java/.../EspSerialModule.kt
├── index.ts                            — JS API surface
└── src/EspSerial.types.ts
```

Uses `mik3y/usb-serial-for-android` for the USB-serial driver layer
(CP2102, CH34x, FTDI, PL2303, CDC-ACM) instead of hand-rolling
`UsbManager`/`UsbDeviceConnection` handling.

### JS API

```ts
listDevices(): Promise<UsbDeviceInfo[]>        // vendorId, productId, deviceName, driverType
requestPermission(deviceId: number): Promise<boolean>
open(deviceId: number, baudRate: number): Promise<void>
close(): Promise<void>
write(bytes: number[] | Uint8Array): Promise<void>
setBaudRate(rate: number): Promise<void>
setControlLines(dtr: boolean, rts: boolean): Promise<void>
addListener('onData', (bytes: Uint8Array) => void)
addListener('onDeviceAttached' | 'onDeviceDetached', (info: UsbDeviceInfo) => void)
addListener('onError', (message: string) => void)
```

`setControlLines` is added now even though Phase 1 (Monitor) doesn't use
it — Phase 4/5's esptool-js Transport will need DTR/RTS toggling to reset
the chip into bootloader mode, and adding it later would mean revisiting
the native layer again.

### Config plugin

- Adds `modules/esp-serial` to `app.json`.
- Injects `<uses-feature android:name="android.hardware.usb.host"
  android:required="false"/>` into `AndroidManifest.xml` (not required, so
  the app doesn't refuse to install on non-USB-host devices).
- Injects `maven { url 'https://jitpack.io' }` into
  `android/build.gradle`'s repositories — `usb-serial-for-android` is
  distributed via JitPack.
- No `device_filter.xml` / auto-launch intent-filter — device selection is
  a deliberate user action (Start button → picker), not an OS-triggered
  app launch on attach.

### Build

Native code — Expo Go can't run it. `npx expo run:android` rebuilds the
dev client; only needed again when native (Kotlin/Gradle) code changes.
JS/hook/UI changes hot-reload normally once the dev client exists.

### Exit test

A throwaway debug screen: `listDevices()` → see the board → `open()` →
`write()` a few bytes → see them echoed via `onData` in the Metro console.
No UI polish — just proof the native bridge round-trips real bytes with
the ESP32-S3 board over the USB-C↔USB-C cable.

## Phase 1 — Monitor screen goes live

### Why a global connection, not per-screen

A USB serial port has exclusive ownership — Monitor and a Tools screen
can't both hold it open at once. The mock UI already hints this was assumed
from the start (`tools/index.tsx`'s "Device not connected" dot and
`upload-firmware.tsx`'s "ESP32-S3 connected" pill are both static, with no
connect action of their own on those screens). So the connection lives in
one global provider; screens just read/drive it.

### `src/providers/device-connection-provider.tsx`

Wraps the `(protected)` layout. Owns the single native port session.

```ts
{
  devices: UsbDeviceInfo[],
  selectedDevice: UsbDeviceInfo | null,
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error',
  connectionError: string | null,
  baudRate: number,
  mode: 'idle' | 'monitor' | 'esptool',   // esptool used starting Phase 3+
  scanDevices(): Promise<UsbDeviceInfo[]>,
  selectAndConnect(deviceId: number, baudRate: number): Promise<void>,  // requestPermission + open
  disconnect(): void,
  setBaudRate(rate: number): void,
  setMode(mode: 'idle' | 'monitor' | 'esptool'): void,
  write(bytes: Uint8Array): void,
  subscribeRaw(onData: (bytes: Uint8Array) => void): () => void,
}
```

Subscribes once, globally, to native `onDeviceAttached`/`onDeviceDetached`
— a mid-session unplug is caught regardless of which screen is active, and
clears `connectionState` back to `disconnected` with `connectionError` set.
Also closes the port on app lifecycle teardown to avoid leaking the file
descriptor.

### `src/components/DeviceSelectSheet.tsx`

Reusable bottom sheet (same visual pattern as the existing
`SelectBottomSheet`), listing `scanDevices()` results. Each row shows a
friendly driver name (`Cp21xxSerialDriver` → "CP2102 · Silicon Labs",
`Ch34xSerialDriver` → "CH340", `FtdiSerialDriver` → "FTDI") plus
vendor:product id as a subtitle. Empty result → "No device found" + Rescan
button, not a silent dismiss. Selecting a row calls `selectAndConnect()`.
Built once, used from Monitor's Start button now; reused verbatim by Tools
screens starting Phase 3.

### `src/hooks/use-serial-monitor.ts`

Thin, Monitor-only. Does not own device selection or connection — only
interprets the byte stream the provider hands it.

```ts
{
  logs: LogLine[],
  send(text: string, lineEnding: LineEnding): void,   // provider.write() with the ending appended
  clearLogs(): void,
}
```

On mount, calls `provider.setMode('monitor')`. Subscribes to
`subscribeRaw`, buffers bytes until a `\n`, turns each full line into a
`LogLine`. Level assignment reuses `flash-log.tsx`'s existing regex
heuristic (`error|failed` → `error`, `warn` → `warn`, else `info`);
connection status lines ("Connected to ...", "Device disconnected") are
appended by the hook itself at `system` level, matching the existing `>
command` echo styling.

### UI wiring in `monitor.tsx`

- `connected`, `INITIAL_LOGS`, `handleSend` local state removed; replaced
  by `useDeviceConnection()` (provider) + `useSerialMonitor()`.
- Start button: if `disconnected`, opens `DeviceSelectSheet`; while
  `connecting`, shows a disabled spinner label; once `connected`, becomes
  "Pause" → calls `provider.disconnect()` (mirrors the existing binary
  Start/Pause semantics — Pause fully closes the port rather than just
  muting the log view).
- Baud rate sheet unchanged visually, now calls `provider.setBaudRate()`
  — applied live via `setParameters` if already connected.
- `LINE_ENDINGS` selector unchanged, now passed through to
  `useSerialMonitor().send()`.
- `EmptyState` shows `connectionError` (e.g. "No device found",
  "Permission denied") when set, otherwise keeps the current "Not
  Connected yet" copy.
- Plotter tab is untouched — stays on mock data (explicitly deferred).

### Free side effect

`tools/index.tsx`'s static "Device not connected" dot can read the same
`connectionState` from the provider for near-zero extra cost — not part of
this phase's required scope, but worth doing since the wiring already
exists.

## Testing & validation plan

No Android emulator support for USB Host — all testing is on the physical
phone + ESP32-S3 board.

**Phase 0 exit:** debug harness round-trips bytes over the real USB-C
cable, confirmed in the Metro console.

**Phase 1 exit (end-to-end):** plug in board → Start → `DeviceSelectSheet`
shows it → select → Android's native USB permission dialog → grant →
connected pill → real `Serial.print` output appears in the log → type a
command → send → board receives it (a simple echo/heartbeat test sketch is
useful here if nothing suitable is already flashed) → change baud rate
while connected → unplug mid-session → confirm auto-disconnect + red
system log line → replug → confirm reconnect flow works again.

## Known risks

- `usb-serial-for-android` resolves via JitPack — the config plugin must
  inject the JitPack Maven repository or the Gradle dependency won't
  resolve.
- Native port must be closed on app background/teardown to avoid leaking
  the file descriptor.
- Android remembers USB permission grants per device while it stays
  plugged in; a cold app start after unplug/replug re-prompting is
  expected OS behavior, not a bug.

## Files touched (Phase 0–1)

```
modules/esp-serial/                                — new native Expo Module
src/providers/device-connection-provider.tsx        — new
src/hooks/use-device-connection.ts                  — new (context consumer)
src/hooks/use-serial-monitor.ts                     — new
src/components/DeviceSelectSheet.tsx                — new
src/app/(protected)/(tabs)/monitor.tsx              — rewired to real hooks
src/app/(protected)/(tabs)/tools/index.tsx           — connection dot reads global state
src/app/(protected)/_layout.tsx                      — wraps children in DeviceConnectionProvider
app.json                                             — adds modules/esp-serial plugin
```
