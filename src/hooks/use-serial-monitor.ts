import { useDeviceConnection } from "@/hooks/use-device-connection";
import type { LogLevel, LogLine } from "@/hooks/use-run-session";
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
  const { connectionState, subscribeRaw, write, setMode } = useDeviceConnection();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const bufferRef = useRef("");
  const wasConnectedRef = useRef(false);

  const appendLine = useCallback((level: LogLevel, text: string) => {
    setLogs((prev) => [...prev, { id: `${prev.length}-${level}`, time: timestamp(), level, text }]);
  }, []);

  useEffect(() => {
    setMode("monitor");
    return () => setMode("idle");
  }, [setMode]);

  useEffect(() => {
    return subscribeRaw((bytes) => {
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
      write(payload);
    },
    [appendLine, write],
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, send, clearLogs };
}

export type UseSerialMonitor = ReturnType<typeof useSerialMonitor>;
