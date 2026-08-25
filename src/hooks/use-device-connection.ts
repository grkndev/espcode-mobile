import { DeviceConnectionContext } from "@/providers/device-connection-provider";
import { useContext } from "react";

export function useDeviceConnection() {
  const context = useContext(DeviceConnectionContext);
  if (!context) {
    throw new Error("useDeviceConnection must be used within a DeviceConnectionProvider");
  }
  return context;
}
