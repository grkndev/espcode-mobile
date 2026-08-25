import * as EspSerial from "@/modules/esp-serial";
import { ClassicReset, UsbJtagSerialReset, type ResetConstructors } from "esptool-js";

/**
 * Reset strategies that run the whole DTR/RTS pulse sequence natively in one
 * call instead of esptool-js's default Transport-driven per-toggle awaits -
 * see EspSerialModule.kt's classicReset()/usbJtagSerialReset() for why that
 * matters (bridge round-trip jitter between individually-awaited setDTR/
 * setRTS calls is enough to break the chip's strapping-pin sample timing
 * during reset). Pass `nativeResetConstructors` via ESPLoader's
 * `resetConstructors` option wherever an ESPLoader is constructed.
 *
 * Extends esptool-js's own classes (overriding only reset()) rather than
 * implementing ResetStrategy from scratch: ResetConstructors' fields are
 * typed to return these concrete classes specifically, not the ResetStrategy
 * interface they implement.
 */
class NativeClassicReset extends ClassicReset {
  reset(): Promise<void> {
    return EspSerial.classicReset(this.resetDelay);
  }
}

class NativeUsbJtagSerialReset extends UsbJtagSerialReset {
  reset(): Promise<void> {
    return EspSerial.usbJtagSerialReset();
  }
}

export const nativeResetConstructors: ResetConstructors = {
  classicReset: (transport, resetDelay) => new NativeClassicReset(transport, resetDelay),
  usbJTAGSerialReset: (transport) => new NativeUsbJtagSerialReset(transport),
};
