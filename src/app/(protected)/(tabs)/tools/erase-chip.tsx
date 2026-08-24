import Icons from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

const CONFIRM_WORD = "ERASE";

type Status = "idle" | "erasing" | "done";

function EraseChipBody() {
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const startErase = () => {
    if (!canConfirm) return;
    setStatus("erasing");
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 10 + 5;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setStatus("done");
          return 100;
        }
        return next;
      });
    }, 220);
  };

  if (status === "erasing") {
    return (
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="items-center gap-2">
          <Icons name="IconEraser" color="#f87171" size={28} />
          <Text weight="bold" className="text-lg text-primary">
            Erasing flash memory
          </Text>
          <Text className="text-sm text-secondary">
            Do not disconnect the device
          </Text>
        </View>
        <ProgressBar progress={progress} color="#dc2626" />
        <Text
          style={{ fontFamily: Fonts?.mono }}
          className="text-center text-[13px] text-zinc-500"
        >
          Erasing flash... ({Math.round(progress)}%)
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
          Chip erased
        </Text>
        <Text className="text-center text-sm text-secondary">
          All data has been permanently removed from flash memory.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-5 px-6 pt-6">
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-red-950/60">
          <Icons name="IconAlertTriangleFilled" color="#f87171" size={28} />
        </View>
        <Text weight="bold" className="text-center text-lg text-primary">
          This will permanently erase everything
        </Text>
        <Text className="text-center text-sm text-secondary">
          Firmware, filesystem, and all stored data on the flash memory will be
          deleted. This cannot be undone.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-xs text-secondary">
          Type{" "}
          <Text weight="bold" className="text-primary">
            {CONFIRM_WORD}
          </Text>{" "}
          to confirm
        </Text>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={CONFIRM_WORD}
          placeholderTextColor="#3f3f46"
          className="rounded-xl bg-element px-4 py-3 text-primary"
          style={{ color: "#ffffff" }}
        />
      </View>

      <View className="flex-1" />

      <Pressable
        onPress={startErase}
        disabled={!canConfirm}
        className={`mb-4 items-center rounded-xl py-3.5 ${canConfirm ? "bg-red-600" : "bg-element"}`}
      >
        <Text
          weight="bold"
          className={canConfirm ? "text-white" : "text-zinc-600"}
        >
          Erase Chip
        </Text>
      </Pressable>
    </View>
  );
}

export default function EraseChipScreen() {
  return (
    <ToolScreenModal title="Erase Chip">
      <EraseChipBody />
    </ToolScreenModal>
  );
}
