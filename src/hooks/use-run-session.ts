import type { MockProject } from "@/constants/mock-projects";
import { useCallback, useEffect, useRef, useState } from "react";

export type RunMode = "compile" | "upload";
export type RunStatus = "idle" | "compiling" | "uploading" | "verifying" | "success" | "error";
export type LogLevel = "info" | "warn" | "error" | "system";
export type LogLine = { id: string; time: string; level: LogLevel; text: string };

const COMPILE_END = 100;
const UPLOAD_COMPILE_END = 40;
const UPLOAD_UPLOAD_END = 85;

function timestamp() {
  return `${new Date().toLocaleTimeString("en-GB", { hour12: false })}.${String(
    new Date().getMilliseconds(),
  ).padStart(3, "0")}`;
}

/** Independent of tab state so a run keeps going if the user switches back to a file tab. */
export function useRunSession() {
  const [mode, setMode] = useState<RunMode | null>(null);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<RunStatus>("idle");

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const log = useCallback((level: LogLevel, text: string) => {
    setLogs((prev) => [...prev, { id: `${prev.length}-${text}`, time: timestamp(), level, text }]);
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode(null);
    setStatus("idle");
    setProgress(0);
    setLogs([]);
    stageRef.current = "idle";
  }, []);

  const start = useCallback(
    (project: MockProject, runMode: RunMode) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setMode(runMode);
      setStatus("compiling");
      setProgress(0);
      stageRef.current = "compiling";
      setLogs([{ id: "start", time: timestamp(), level: "system", text: `Building ${project.name} for ${project.board}...` }]);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = Math.min(100, prev + Math.random() * 10 + 4);
          const compileEnd = runMode === "compile" ? COMPILE_END : UPLOAD_COMPILE_END;

          if (stageRef.current === "compiling" && next >= compileEnd) {
            if (runMode === "compile") {
              log("system", "Build succeeded");
              stageRef.current = "success";
              setStatus("success");
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 100;
            }
            log("info", `Connecting to ${project.board}...`);
            stageRef.current = "uploading";
            setStatus("uploading");
          } else if (stageRef.current === "uploading" && next >= UPLOAD_UPLOAD_END) {
            log("info", `Writing at 0x00010000... (${Math.round(next)}%)`);
            stageRef.current = "verifying";
            setStatus("verifying");
          } else if (stageRef.current === "verifying" && next >= 100) {
            log("system", "Hash of data verified");
            log("system", "Upload complete");
            stageRef.current = "success";
            setStatus("success");
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 100;
          }

          return next;
        });
      }, 220);
    },
    [log],
  );

  return { mode, status, progress, logs, start, clear };
}

export type UseRunSession = ReturnType<typeof useRunSession>;
