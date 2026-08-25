export type UsbDeviceInfo = {
  id: number;
  vendorId: number;
  productId: number;
  deviceName: string;
  driverType: string;
};

export type EspSerialModuleEvents = {
  onData: (event: { bytes: Uint8Array }) => void;
  onDeviceAttached: (event: UsbDeviceInfo) => void;
  onDeviceDetached: (event: { id: number; wasConnected: boolean }) => void;
  onError: (event: { message: string }) => void;
};
