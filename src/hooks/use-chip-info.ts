import { useDeviceConnection } from "@/hooks/use-device-connection";
import { useEspTransport } from "@/hooks/use-esp-transport";
import { nativeResetConstructors } from "@/lib/esp-reset-strategies";
import { parsePartitionTable, type PartitionEntry } from "@/lib/partition-table";
import { ESPLoader } from "esptool-js";
import { useCallback, useState } from "react";

export type ChipInfo = {
  chip: string;
  macAddress: string;
  flashSize: string;
  crystalFreq: string;
  features: string;
};

export type ChipInfoStatus = "idle" | "reading" | "success" | "error";

const PARTITION_TABLE_OFFSET = 0x8000;
const PARTITION_TABLE_SIZE = 0xc00;

export function useChipInfo() {
  const conn = useDeviceConnection();
  const transport = useEspTransport();
  const [status, setStatus] = useState<ChipInfoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [chipInfo, setChipInfo] = useState<ChipInfo | null>(null);
  const [partitions, setPartitions] = useState<PartitionEntry[]>([]);

  const refresh = useCallback(async () => {
    setStatus("reading");
    setError(null);
    try {
      const loader = new ESPLoader({
        transport,
        baudrate: 115200,
        resetConstructors: nativeResetConstructors,
      });
      await loader.main();
      const chip = loader.chip;

      // Sequential, not Promise.all: the transport is a single request/
      // response serial channel, concurrent overlapping commands would
      // corrupt the exchange.
      const chipDescription = await chip.getChipDescription(loader);
      const macAddress = await chip.readMac(loader);
      const crystalFreq = await chip.getCrystalFreq(loader);
      const features = await chip.getChipFeatures(loader);
      const flashSize = await loader.detectFlashSize();

      setChipInfo({
        chip: chipDescription,
        macAddress: macAddress.toUpperCase(),
        flashSize,
        crystalFreq: `${crystalFreq}MHz`,
        features: features.join(", "),
      });

      const table = await loader.readFlash(PARTITION_TABLE_OFFSET, PARTITION_TABLE_SIZE);
      setPartitions(parsePartitionTable(table));

      await loader.after("hard_reset");
      conn.setMode("idle");
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [transport, conn]);

  return { status, error, chipInfo, partitions, refresh };
}

export type UseChipInfo = ReturnType<typeof useChipInfo>;
