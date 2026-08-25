import { useDeviceConnection } from "@/hooks/use-device-connection";
import { useEspTransport } from "@/hooks/use-esp-transport";
import { nativeResetConstructors } from "@/lib/esp-reset-strategies";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { ESPLoader, type FlashSizeValues } from "esptool-js";
import { useCallback, useState } from "react";

export type UploadStatus = "idle" | "uploading" | "verifying" | "success" | "error";

export type PickedFile = {
  name: string;
  bytes: Uint8Array<ArrayBuffer>;
};

export function useFirmwareUpload() {
  const conn = useDeviceConnection();
  const transport = useEspTransport();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback(async () => {
    setError(null);
    // No MIME-type filter or filename check: .bin has no registered MIME
    // type, so Android's content providers report picked files under it
    // inconsistently (this previously rejected a real .bin the user picked,
    // because the name/type SAF handed back didn't match what was
    // expected). Trust the user's selection - a bad pick fails naturally at
    // the write/verify step instead.
    const result = await File.pickFileAsync();
    if (result.canceled) return;
    const picked = result.result;
    const bytes = new Uint8Array(await picked.arrayBuffer());
    setFile({ name: picked.name, bytes });
  }, []);

  const upload = useCallback(
    async (offset: number) => {
      if (!file) return;
      setStatus("uploading");
      setProgress(0);
      setError(null);
      try {
        const loader = new ESPLoader({
          transport,
          baudrate: 115200,
          resetConstructors: nativeResetConstructors,
        });
        await loader.main();

        const detectedFlashSize = (await loader.detectFlashSize()) as FlashSizeValues;
        const flashSizeBytes = loader.flashSizeBytes(detectedFlashSize);
        if (offset + file.bytes.length > flashSizeBytes) {
          throw new Error("File doesn't fit in available flash at this offset");
        }

        await loader.writeFlash({
          fileArray: [{ data: file.bytes, address: offset }],
          flashMode: "keep",
          flashFreq: "keep",
          flashSize: "keep",
          eraseAll: false,
          compress: true,
          reportProgress: (_fileIndex, written, total) => {
            setProgress(Math.round((written / total) * 100));
          },
        });

        setStatus("verifying");
        const localDigest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.MD5, file.bytes);
        const localHex = loader.toHex(new Uint8Array(localDigest));
        const remoteHex = await loader.flashMd5sum(offset, file.bytes.length);
        if (localHex.toLowerCase() !== remoteHex.toLowerCase()) {
          throw new Error("Verification failed - hash mismatch");
        }

        await loader.after("hard_reset");
        conn.setMode("idle");
        setStatus("success");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [file, transport, conn],
  );

  const reset = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { file, status, progress, error, pickFile, upload, reset };
}

export type UseFirmwareUpload = ReturnType<typeof useFirmwareUpload>;
