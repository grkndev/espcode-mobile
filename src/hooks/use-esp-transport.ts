import { useDeviceConnection } from "@/hooks/use-device-connection";
import { EspSerialPort } from "@/lib/esp-serial-port";
import { Transport } from "esptool-js";
import { useMemo, useRef } from "react";

/**
 * A stable esptool-js Transport backed by the shared native connection.
 * Created once per mount - not on every connection-state change, since
 * Transport itself drives connect/disconnect repeatedly during normal
 * operation (see EspSerialPort's doc comment) and recreating it mid-flow
 * would drop its internal read state.
 */
export function useEspTransport(): Transport {
  const conn = useDeviceConnection();
  const connRef = useRef(conn);
  connRef.current = conn;

  const port = useMemo(() => new EspSerialPort(() => connRef.current), []);
  return useMemo(() => new Transport(port as unknown as SerialPort, __DEV__), [port]);
}
