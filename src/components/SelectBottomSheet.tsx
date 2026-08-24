import Icons from "@/components/Icons";
import Text from "@/components/Text";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback } from "react";
import { Pressable } from "react-native";

export type SelectOption = { value: string; label: string };

type Props = {
  title: string;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
};

const SelectBottomSheet = forwardRef<BottomSheetModal, Props>(function SelectBottomSheet(
  { title, options, value, onSelect },
  ref,
) {
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
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
    >
      <BottomSheetView style={{ paddingTop: 4, paddingBottom: 24 }}>
        <Text weight="bold" className="px-4 pb-3 text-primary">
          {title}
        </Text>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              className={`flex-row items-center justify-between px-4 py-3.5 ${selected ? "bg-purple-700/15" : ""}`}
            >
              <Text
                weight={selected ? "semibold" : "regular"}
                className={selected ? "text-purple-400" : "text-primary"}
              >
                {option.label}
              </Text>
              {selected && <Icons name="IconCheck" color="#a855f7" size={18} />}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default SelectBottomSheet;
