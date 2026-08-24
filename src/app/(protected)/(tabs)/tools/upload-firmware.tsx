import Icons from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import SelectBottomSheet from "@/components/SelectBottomSheet";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

const OFFSETS = [
  { value: "0x0", label: "0x0 · Bootloader" },
  { value: "0x8000", label: "0x8000 · Partition Table" },
  { value: "0x10000", label: "0x10000 · Application" },
];

const MOCK_FILE = { name: "firmware-v1.2.0.bin", size: "1.4 MB" };

type Status = "idle" | "uploading" | "done";

function UploadFirmwareBody() {
  const [file, setFile] = useState<typeof MOCK_FILE | null>(null);
  const [offset, setOffset] = useState(OFFSETS[2].value);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startUpload = () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 12 + 4;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setStatus("done");
          return 100;
        }
        return next;
      });
    }, 200);
  };

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setFile(null);
  };

  if (status === "uploading") {
    return (
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="items-center gap-2">
          <Text weight="bold" className="text-lg text-primary">
            Uploading firmware
          </Text>
          <Text className="text-sm text-secondary">{file?.name}</Text>
        </View>
        <View className="gap-2">
          <ProgressBar progress={progress} />
          <Text className="text-right text-xs text-secondary">
            {Math.round(progress)}%
          </Text>
        </View>
        <Text
          style={{ fontFamily: Fonts?.mono }}
          className="text-center text-[13px] text-zinc-500"
        >
          {progress < 90
            ? `Writing at ${offset}... (${Math.round(progress)}%)`
            : "Verifying..."}
        </Text>
      </View>
    );
  }

  if (status === "done") {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60">
          <Icons name="IconCircleCheckFilled" color="#34d399" size={32} />
        </View>
        <Text weight="bold" className="text-center text-lg text-primary">
          Upload complete
        </Text>
        <Text className="text-center text-sm text-secondary">
          {file?.name} was flashed successfully.
        </Text>
        <Pressable
          onPress={reset}
          className="mt-4 rounded-xl bg-purple-700 px-6 py-3"
        >
          <Text weight="bold" className="text-white">
            Upload Another
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 px-4 pt-4">
      <View className="flex-row items-center gap-2">
        <View className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
        <Text className="text-xs text-zinc-500">ESP32-S3 connected</Text>
      </View>

      <Pressable
        onPress={() => setFile(MOCK_FILE)}
        className={`items-center justify-center gap-2 rounded-xl border p-6 ${
          file
            ? "border-[#2A3239] bg-[#12181D]"
            : "border-dashed border-zinc-700"
        }`}
      >
        {file ? (
          <>
            <Icons name="IconFile" color="#8F8EFC" size={28} />
            <Text weight="bold" className="text-primary">
              {file.name}
            </Text>
            <Text className="text-xs text-secondary">{file.size}</Text>
            <Text weight="semibold" className="mt-1 text-xs text-purple-400">
              Change file
            </Text>
          </>
        ) : (
          <>
            <Icons name="IconUpload" color="#71717a" size={24} />
            <Text weight="semibold" className="text-primary">
              Select .bin file
            </Text>
            <Text className="text-xs text-secondary">
              Tap to choose a compiled firmware binary
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        onPress={() => offsetSheetRef.current?.present()}
        className="flex-row items-center justify-between rounded-xl bg-element px-4 py-3"
      >
        <Text className="text-sm text-secondary">Flash offset</Text>
        <View className="flex-row items-center gap-1">
          <Text weight="semibold" className="text-primary">
            {offset}
          </Text>
          <Icons name="IconChevronDown" color="#B0B4BA" size={16} />
        </View>
      </Pressable>

      <View className="flex-1" />

      <Pressable
        onPress={startUpload}
        disabled={!file}
        className={`mb-4 items-center rounded-xl py-3.5 ${file ? "bg-purple-700" : "bg-element"}`}
      >
        <Text weight="bold" className={file ? "text-white" : "text-zinc-600"}>
          Upload Firmware
        </Text>
      </Pressable>

      <SelectBottomSheet
        ref={offsetSheetRef}
        title="Flash Offset"
        options={OFFSETS}
        value={offset}
        onSelect={(v) => {
          setOffset(v);
          offsetSheetRef.current?.dismiss();
        }}
      />
    </View>
  );
}

export default function UploadFirmwareScreen() {
  return (
    <ToolScreenModal title="Upload Firmware">
      <UploadFirmwareBody />
    </ToolScreenModal>
  );
}
