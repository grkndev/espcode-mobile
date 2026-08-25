import Icons from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import SelectBottomSheet from "@/components/SelectBottomSheet";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useDeviceConnection } from "@/hooks/use-device-connection";
import { useFirmwareUpload } from "@/hooks/use-firmware-upload";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { Pressable, View } from "react-native";

const OFFSETS = [
  { value: "0x0", label: "0x0 · Bootloader" },
  { value: "0x8000", label: "0x8000 · Partition Table" },
  { value: "0x10000", label: "0x10000 · Application" },
];

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function UploadFirmwareBody() {
  const { connectionState, selectedDevice } = useDeviceConnection();
  const { file, status, progress, error, pickFile, upload, reset } = useFirmwareUpload();
  const [offset, setOffset] = useState(OFFSETS[2].value);
  const offsetSheetRef = useRef<BottomSheetModal>(null);

  const connected = connectionState === "connected";

  if (status === "uploading" || status === "verifying") {
    return (
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="items-center gap-2">
          <Text weight="bold" className="text-lg text-primary">
            Uploading firmware
          </Text>
          <Text className="text-sm text-secondary">{file?.name}</Text>
        </View>
        <View className="gap-2">
          <ProgressBar progress={status === "verifying" ? 100 : progress} />
          <Text className="text-right text-xs text-secondary">
            {status === "verifying" ? "100%" : `${progress}%`}
          </Text>
        </View>
        <Text
          style={{ fontFamily: Fonts?.mono }}
          className="text-center text-[13px] text-zinc-500"
        >
          {status === "verifying" ? "Verifying..." : `Writing at ${offset}... (${progress}%)`}
        </Text>
      </View>
    );
  }

  if (status === "success") {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60">
          <Icons name="IconCircleCheckFilled" color="#34d399" size={32} />
        </View>
        <Text weight="bold" className="text-center text-lg text-primary">
          Upload complete
        </Text>
        <Text className="text-center text-sm text-secondary">
          {file?.name} was flashed and verified successfully.
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

  if (status === "error") {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-red-950/60">
          <Icons name="IconAlertTriangleFilled" color="#f87171" size={28} />
        </View>
        <Text weight="bold" className="text-center text-lg text-primary">
          Upload failed
        </Text>
        <Text className="text-center text-sm text-secondary">{error}</Text>
        <Pressable
          onPress={reset}
          className="mt-4 rounded-xl bg-element px-6 py-3"
        >
          <Text weight="bold" className="text-primary">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 px-4 pt-4">
      <View className="flex-row items-center gap-2">
        <View className={`h-[7px] w-[7px] rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-700"}`} />
        <Text className="text-xs text-zinc-500">
          {connected ? `${selectedDevice?.driverType ?? "Device"} connected` : "Device not connected"}
        </Text>
      </View>

      {error && (
        <Text className="text-xs text-red-400">{error}</Text>
      )}

      <Pressable
        onPress={pickFile}
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
            <Text className="text-xs text-secondary">{formatFileSize(file.bytes.length)}</Text>
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
        onPress={() => upload(Number(offset))}
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
