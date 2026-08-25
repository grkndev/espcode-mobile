import { type FileMeta, getMockProject } from "@/constants/mock-projects";
import { useCallback, useMemo, useState } from "react";

export const CONSOLE_TAB_ID = "console";

type TabId = string | typeof CONSOLE_TAB_ID;

/**
 * Storage seam for the editor screen. Backed by in-memory mock state today;
 * every mutation goes through this hook's functions so a future local
 * (expo-file-system) or cloud storage provider can replace only this file.
 */
export function useEditorFiles(projectId?: string | null) {
  const initialProject = useMemo(() => getMockProject(projectId), [projectId]);

  const [projectMeta] = useState(() => ({
    id: initialProject.id,
    name: initialProject.name,
    board: initialProject.board,
    branch: initialProject.branch,
  }));
  const [fileOrder, setFileOrder] = useState(() => initialProject.files.map((f) => f.id));
  const [filesById, setFilesById] = useState<Record<string, FileMeta>>(() =>
    Object.fromEntries(initialProject.files.map((f) => [f.id, f])),
  );
  const [openTabs, setOpenTabs] = useState<string[]>(() =>
    initialProject.files.slice(0, 2).map((f) => f.id),
  );
  const [activeTabId, setActiveTabId] = useState<TabId>(
    () => initialProject.files[0]?.id ?? CONSOLE_TAB_ID,
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());

  const files = useMemo(() => fileOrder.map((id) => filesById[id]), [fileOrder, filesById]);
  const closedFiles = useMemo(
    () => files.filter((f) => !openTabs.includes(f.id)),
    [files, openTabs],
  );
  const isAnyDirty = dirtyIds.size > 0;

  const openFile = useCallback((id: string) => {
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveTabId(id);
  }, []);

  const setActiveTab = useCallback((id: TabId) => {
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((tabId) => tabId !== id);
        if (activeTabId === id) {
          setActiveTabId(next.length > 0 ? next[next.length - 1] : CONSOLE_TAB_ID);
        }
        return next;
      });
      setDirtyIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [activeTabId],
  );

  const createFile = useCallback(
    (name: string): { ok: true; id: string } | { ok: false; error: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "Enter a file name." };
      if (!/\.[a-zA-Z0-9]+$/.test(trimmed)) {
        return { ok: false, error: "Add a file extension, e.g. .py" };
      }
      if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false, error: "A file with that name already exists." };
      }
      const id = `${trimmed}-${Date.now()}`;
      const language = trimmed.endsWith(".py")
        ? "python"
        : trimmed.endsWith(".cpp") || trimmed.endsWith(".h") || trimmed.endsWith(".ino")
          ? "cpp"
          : "plain";
      const meta: FileMeta = { id, name: trimmed, language, content: "" };
      setFilesById((prev) => ({ ...prev, [id]: meta }));
      setFileOrder((prev) => [...prev, id]);
      setOpenTabs((prev) => [...prev, id]);
      setActiveTabId(id);
      return { ok: true, id };
    },
    [files],
  );

  const renameFile = useCallback((id: string, name: string) => {
    setFilesById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], name } } : prev));
  }, []);

  const deleteFile = useCallback(
    (id: string) => {
      setFileOrder((prev) => prev.filter((fileId) => fileId !== id));
      setFilesById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      closeTab(id);
    },
    [closeTab],
  );

  const markDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((prev) => {
      const has = prev.has(id);
      if (dirty === has) return prev;
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const commitContent = useCallback((id: string, text: string) => {
    setFilesById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], content: text } } : prev));
    setDirtyIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    project: { ...projectMeta, files },
    files,
    closedFiles,
    openTabs,
    activeTabId,
    dirtyIds,
    isAnyDirty,
    openFile,
    closeTab,
    setActiveTab,
    createFile,
    renameFile,
    deleteFile,
    markDirty,
    commitContent,
  };
}

export type UseEditorFiles = ReturnType<typeof useEditorFiles>;
