import Icons from "@/components/Icons";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { Fonts } from "@/constants/theme";
import { useEraseChip } from "@/hooks/use-erase-chip";
import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

const CONFIRM_WORD = "ERASE";

function EraseChipBody() {
  const { status, error, elapsedSeconds, erase, reset } = useEraseChip();
  const [confirmText, setConfirmText] = useState("");

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD;

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
        <ActivityIndicator size="large" color="#dc2626" />
        <Text
          style={{ fontFamily: Fonts?.mono }}
          className="text-center text-[13px] text-zinc-500"
        >
          Erasing flash... {elapsedSeconds}s elapsed (can take up to 2 minutes)
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
          Chip erased
        </Text>
        <Text className="text-center text-sm text-secondary">
          All data has been permanently removed from flash memory.
        </Text>
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
          Erase failed
        </Text>
        <Text className="text-center text-sm text-secondary">{error}</Text>
        <Pressable
          onPress={() => {
            reset();
            setConfirmText("");
          }}
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
        onPress={erase}
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
