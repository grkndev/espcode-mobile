import { useDeviceConnection } from "@/hooks/use-device-connection";
import type { LogLevel, LogLine } from "@/hooks/use-run-session";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export type LineEnding = "LF" | "CR" | "CRLF" | "None";

const LINE_ENDING_BYTES: Record<LineEnding, number[]> = {
  LF: [0x0a],
  CR: [0x0d],
  CRLF: [0x0d, 0x0a],
  None: [],
};

function classifyLevel(text: string): LogLevel {
  if (/error|failed|timed out/i.test(text)) return "error";
  if (/warn/i.test(text)) return "warn";
  return "info";
}

function timestamp(): string {
  const now = new Date();
  return `${now.toLocaleTimeString("en-GB", { hour12: false })}.${String(now.getMilliseconds()).padStart(3, "0")}`;
}

/** Interprets the shared raw byte stream as line-buffered monitor logs; independent of tab/screen lifetime. */
export function useSerialMonitor() {
  const { connectionState, mode, subscribeRaw, write, setMode } = useDeviceConnection();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const bufferRef = useRef("");
  const wasConnectedRef = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const appendLine = useCallback((level: LogLevel, text: string) => {
    setLogs((prev) => [...prev, { id: `${prev.length}-${level}`, time: timestamp(), level, text }]);
  }, []);

  // useFocusEffect, not a plain mount effect: the Monitor tab stays mounted
  // in the background once first visited (tab navigators don't unmount
  // inactive tabs), so a plain `useEffect` only claims "monitor" mode once,
  // the very first time this screen mounts. Any esptool-js operation run
  // afterward (from a different screen) flips the shared `mode` to
  // "esptool" and nothing would ever claim it back - Monitor would show
  // "Connected" but silently drop every incoming byte forever (see the
  // guard below). useFocusEffect re-claims "monitor" every time this tab
  // actually becomes the active one again.
  useFocusEffect(
    useCallback(() => {
      setMode("monitor");
      return () => setMode("idle");
    }, [setMode]),
  );

  // A second consumer (esptool) can share this same raw byte stream while
  // Monitor stays mounted in the background (tab navigators don't unmount
  // inactive tabs) - ignore bytes while some other flow owns the port so
  // binary protocol data never gets line-buffered as if it were text.
  useEffect(() => {
    return subscribeRaw((bytes) => {
      if (modeRef.current !== "monitor") return;
      bufferRef.current += new TextDecoder().decode(bytes);
      const lines = bufferRef.current.split("\n");
      bufferRef.current = lines.pop() ?? "";
      for (const rawLine of lines) {
        const text = rawLine.replace(/\r$/, "");
        if (text.length === 0) continue;
        appendLine(classifyLevel(text), text);
      }
    });
  }, [subscribeRaw, appendLine]);

  useEffect(() => {
    if (connectionState === "connected" && !wasConnectedRef.current) {
      appendLine("system", "Connected");
    } else if (connectionState !== "connected" && wasConnectedRef.current) {
      appendLine("system", "Disconnected");
    }
    wasConnectedRef.current = connectionState === "connected";
  }, [connectionState, appendLine]);

  const send = useCallback(
    (text: string, lineEnding: LineEnding) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      appendLine("system", `> ${trimmed}`);
      const bodyBytes = new TextEncoder().encode(trimmed);
      const endingBytes = LINE_ENDING_BYTES[lineEnding];
      const payload = new Uint8Array(bodyBytes.length + endingBytes.length);
      payload.set(bodyBytes, 0);
      payload.set(endingBytes, bodyBytes.length);
      write(payload).catch(() => {});
    },
    [appendLine, write],
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, send, clearLogs };
}

export type UseSerialMonitor = ReturnType<typeof useSerialMonitor>;
