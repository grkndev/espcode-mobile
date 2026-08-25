import { useDeviceConnection } from "@/hooks/use-device-connection";
import { useEspTransport } from "@/hooks/use-esp-transport";
import { nativeResetConstructors } from "@/lib/esp-reset-strategies";
import { ESPLoader } from "esptool-js";
import { useCallback, useState } from "react";

export type EraseStatus = "idle" | "erasing" | "success" | "error";

export function useEraseChip() {
  const conn = useDeviceConnection();
  const transport = useEspTransport();
  const [status, setStatus] = useState<EraseStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const erase = useCallback(async () => {
    setStatus("erasing");
    setError(null);
    setElapsedSeconds(0);
    const tick = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    try {
      const loader = new ESPLoader({
        transport,
        baudrate: 115200,
        resetConstructors: nativeResetConstructors,
      });
      await loader.main();
      // eraseFlash() has no progress callback - a single command/response
      // over up to CHIP_ERASE_TIMEOUT (2 minutes), see the design plan.
      await loader.eraseFlash();
      await loader.after("hard_reset");
      conn.setMode("idle");
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(tick);
    }
  }, [transport, conn]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setElapsedSeconds(0);
  }, []);

  return { status, error, elapsedSeconds, erase, reset };
}

export type UseEraseChip = ReturnType<typeof useEraseChip>;
