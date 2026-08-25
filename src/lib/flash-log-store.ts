import { File, Paths } from "expo-file-system";

export type FlashLogSession = {
  id: string;
  date: string;
  file: string;
  duration: string;
  success: boolean;
  lines: string[];
};

const LOG_FILE = new File(Paths.document, "flash-log.json");
const MAX_SESSIONS = 20;

export function loadSessions(): FlashLogSession[] {
  try {
    if (!LOG_FILE.exists) return [];
    const parsed = JSON.parse(LOG_FILE.textSync());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: FlashLogSession): void {
  const next = [session, ...loadSessions()].slice(0, MAX_SESSIONS);
  if (!LOG_FILE.exists) LOG_FILE.create();
  LOG_FILE.write(JSON.stringify(next));
}

export function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  if (dayDiff > 1) return `${dayDiff} days ago, ${time}`;
  return date.toLocaleDateString();
}
