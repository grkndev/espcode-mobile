import Icons from "@/components/Icons";
import Text from "@/components/Text";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useState } from "react";
import { Pressable, View } from "react-native";

type Props = {
  fileName?: string;
  onFind: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCloseTab: () => void;
  onDismiss: () => void;
};

const EditorMenuSheet = forwardRef<BottomSheetModal, Props>(
  function EditorMenuSheet(
    { fileName, onFind, onRename, onDelete, onCloseTab, onDismiss },
    ref,
  ) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#12181D" }}
        handleIndicatorStyle={{ backgroundColor: "#3f3f46" }}
        onChange={(index) => {
          if (index === 0) setConfirmingDelete(false);
        }}
        onDismiss={onDismiss}
      >
        <BottomSheetView style={{ paddingTop: 4, paddingBottom: 24 }}>
          {confirmingDelete ? (
            <View className="gap-3 px-4 pt-1">
              <Text weight="bold" className="text-primary">
                Delete {fileName}?
              </Text>
              <Text className="text-sm text-secondary">
                This can&apos;t be undone.
              </Text>
              <View className="flex-row gap-2 pt-1">
                <Pressable
                  onPress={() => setConfirmingDelete(false)}
                  className="flex-1 items-center rounded-xl bg-element py-4"
                >
                  <Text weight="semibold" className="text-primary">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onDelete}
                  className="flex-1 items-center rounded-xl bg-red-600 py-4"
                >
                  <Text weight="bold" className="text-white">
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="gap-2 px-4">
              <MenuRow
                icon="IconSearch"
                label="Find in file"
                onPress={onFind}
              />
              <View className="h-px bg-element" />
              <MenuRow icon="IconPencil" label="Rename" onPress={onRename} />
              <View className="h-px bg-element" />
              <MenuRow icon="IconX" label="Close tab" onPress={onCloseTab} />
              <View className="h-px bg-element" />
              <MenuRow
                icon="IconTrash"
                label="Delete"
                destructive
                onPress={() => setConfirmingDelete(true)}
              />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

function MenuRow({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icons>["name"];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3.5 rounded-xl px-2 py-4 ${
        destructive
          ? "bg-red-500/10 active:bg-red-500/20"
          : "active:bg-selected"
      }`}
    >
      <Icons
        name={icon}
        color={destructive ? "#f87171" : "#8F8EFC"}
        size={18}
      />

      <Text className={destructive ? "text-red-400" : "text-primary"}>
        {label}
      </Text>
    </Pressable>
  );
}

export default EditorMenuSheet;
