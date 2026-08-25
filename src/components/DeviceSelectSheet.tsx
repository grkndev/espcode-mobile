import Icons from "@/components/Icons";
import Text from "@/components/Text";
import { useDeviceConnection } from "@/hooks/use-device-connection";
import type { UsbDeviceInfo } from "@/modules/esp-serial";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

const DRIVER_LABELS: Record<string, string> = {
  Cp21xxSerialDriver: "CP2102 · Silicon Labs",
  Ch34xSerialDriver: "CH340 · QinHeng",
  FtdiSerialDriver: "FTDI",
  Pl2303SerialDriver: "PL2303 · Prolific",
  CdcAcmSerialDriver: "USB CDC",
};

function driverLabel(driverType: string): string {
  return DRIVER_LABELS[driverType] ?? driverType;
}

function hex(value: number): string {
  return value.toString(16).padStart(4, "0");
}

type Props = {
  baudRate: number;
  onDismiss: () => void;
};

const DeviceSelectSheet = forwardRef<BottomSheetModal, Props>(function DeviceSelectSheet(
  { baudRate, onDismiss },
  ref,
) {
  const { devices, scanDevices, selectAndConnect } = useDeviceConnection();
  const [scanning, setScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<number | null>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const rescan = useCallback(async () => {
    setScanning(true);
    try {
      await scanDevices();
    } finally {
      setScanning(false);
    }
  }, [scanDevices]);

  const selectDevice = useCallback(
    async (device: UsbDeviceInfo) => {
      setConnectingId(device.id);
      try {
        await selectAndConnect(device.id, baudRate);
      } finally {
        setConnectingId(null);
        onDismiss();
      }
    },
    [selectAndConnect, baudRate, onDismiss],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#12181D" }}
      handleIndicatorStyle={{ backgroundColor: "#3f3f46" }}
      onDismiss={onDismiss}
      onChange={(index) => {
        if (index >= 0) rescan();
      }}
    >
      <BottomSheetView style={{ paddingTop: 4, paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between px-4 pb-3">
          <Text weight="bold" className="text-primary">
            Select Device
          </Text>
          <Pressable
            onPress={rescan}
            disabled={scanning}
            className="flex-row items-center gap-1 rounded-lg bg-element px-3 py-1.5"
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#B0B4BA" />
            ) : (
              <Icons name="IconRefresh" color="#B0B4BA" size={14} />
            )}
            <Text className="text-xs text-secondary">Rescan</Text>
          </Pressable>
        </View>

        <View className="gap-2 px-4">
          {devices.length === 0 && !scanning && (
            <View className="items-center gap-2 py-8">
              <Icons name="IconUsb" color="#3f3f46" size={28} />
              <Text weight="bold" className="text-primary">
                No device found
              </Text>
              <Text className="text-center text-xs text-secondary">
                Plug in your board over USB-C and tap Rescan.
              </Text>
            </View>
          )}
          {devices.map((device) => (
            <Pressable
              key={device.id}
              onPress={() => selectDevice(device)}
              disabled={connectingId !== null}
              className="flex-row items-center gap-3 rounded-xl bg-element px-4 py-4 active:bg-selected"
            >
              <Icons name="IconUsb" color="#B0B4BA" size={20} />
              <View className="flex-1 gap-0.5">
                <Text weight="semibold" className="text-primary">
                  {driverLabel(device.driverType)}
                </Text>
                <Text className="text-xs text-secondary">
                  {hex(device.vendorId)}:{hex(device.productId)}
                </Text>
              </View>
              {connectingId === device.id && <ActivityIndicator size="small" color="#a855f7" />}
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default DeviceSelectSheet;
