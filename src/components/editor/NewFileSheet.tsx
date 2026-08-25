import Icons from "@/components/Icons";
import Text from "@/components/Text";
import type { FileMeta } from "@/constants/mock-projects";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";

export type NewFileSheetMode = "create" | "rename";

type Props = {
  mode: NewFileSheetMode;
  initialValue?: string;
  closedFiles: FileMeta[];
  onCreate: (name: string) => { ok: true; id: string } | { ok: false; error: string };
  onRename: (name: string) => void;
  onOpenExisting: (id: string) => void;
  onDismiss: () => void;
};

const NewFileSheet = forwardRef<BottomSheetModal, Props>(function NewFileSheet(
  { mode, initialValue, closedFiles, onCreate, onRename, onOpenExisting, onDismiss },
  ref,
) {
  const [name, setName] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialValue ?? "");
    setError(null);
  }, [initialValue, mode]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const submit = () => {
    if (mode === "rename") {
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Enter a file name.");
        return;
      }
      onRename(trimmed);
      onDismiss();
      return;
    }
    const result = onCreate(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDismiss();
  };

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#12181D" }}
      handleIndicatorStyle={{ backgroundColor: "#3f3f46" }}
      onDismiss={onDismiss}
    >
      <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 12 }}>
        <Text weight="bold" className="text-primary">
          {mode === "rename" ? "Rename File" : "New File"}
        </Text>

        <BottomSheetTextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          onSubmitEditing={submit}
          placeholder="main.py"
          placeholderTextColor="#52525b"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          style={{
            borderRadius: 10,
            backgroundColor: "#000000",
            borderWidth: 1,
            borderColor: error ? "#dc2626" : "#2A3239",
            paddingHorizontal: 14,
            paddingVertical: 14,
            color: "#ffffff",
            fontSize: 15,
          }}
        />
        {error && <Text className="text-xs text-red-400">{error}</Text>}

        <Pressable onPress={submit} disabled={!name.trim()} className={`items-center rounded-xl py-4 ${name.trim() ? "bg-purple-700" : "bg-element"}`}>
          <Text weight="bold" className={name.trim() ? "text-white" : "text-zinc-600"}>
            {mode === "rename" ? "Rename" : "Create"}
          </Text>
        </Pressable>

        {mode === "create" && closedFiles.length > 0 && (
          <View className="gap-2 pt-2">
            <Text weight="semibold" className="pb-1 text-xs uppercase tracking-wide text-zinc-600">
              Open existing
            </Text>
            {closedFiles.map((file) => (
              <Pressable
                key={file.id}
                onPress={() => {
                  onOpenExisting(file.id);
                  onDismiss();
                }}
                className="flex-row items-center gap-3 rounded-xl bg-element px-4 py-4 active:bg-selected"
              >
                <Icons name="IconFile" color="#71717a" size={18} />
                <Text className="text-primary">{file.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default NewFileSheet;
