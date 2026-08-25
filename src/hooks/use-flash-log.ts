import { loadSessions, type FlashLogSession } from "@/lib/flash-log-store";
import { useEffect, useState } from "react";

export function useFlashLog() {
  const [sessions, setSessions] = useState<FlashLogSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  const selected = sessions.find((s) => s.id === selectedId) ?? sessions[0] ?? null;

  return { sessions, selectedId, setSelectedId, selected };
}

export type UseFlashLog = ReturnType<typeof useFlashLog>;
