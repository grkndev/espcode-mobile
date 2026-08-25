import CodeEditor, {
    type CodeEditorRef,
    type RunMode,
} from "@/components/editor/CodeEditor";
import ConsoleBody from "@/components/editor/ConsoleBody";
import EditorHeader from "@/components/editor/EditorHeader";
import EditorMenuSheet from "@/components/editor/EditorMenuSheet";
import NewFileSheet, {
    type NewFileSheetMode,
} from "@/components/editor/NewFileSheet";
import SymbolBar from "@/components/editor/SymbolBar";
import TabStrip from "@/components/editor/TabStrip";
import type { IconName } from "@/components/Icons";
import SelectBottomSheet from "@/components/SelectBottomSheet";
import { CONSOLE_TAB_ID, useEditorFiles } from "@/hooks/use-editor-files";
import { useRunSession } from "@/hooks/use-run-session";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RUN_OPTIONS: { value: string; label: string; icon: IconName }[] = [
  { value: "compile", label: "Compile only", icon: "IconHammer" },
  { value: "upload", label: "Compile & Upload", icon: "IconRocket" },
];

export default function EditorScreen() {
  const { project: projectId } = useLocalSearchParams<{ project?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const editorFiles = useEditorFiles(projectId);
  const runSession = useRunSession();
  const editorRef = useRef<CodeEditorRef>(null);
  const runSheetRef = useRef<BottomSheetModal>(null);
  const newFileSheetRef = useRef<BottomSheetModal>(null);
  const menuSheetRef = useRef<BottomSheetModal>(null);

  const [editorReady, setEditorReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [newFileMode, setNewFileMode] = useState<NewFileSheetMode>("create");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const activeFile = editorFiles.files.find(
    (f) => f.id === editorFiles.activeTabId,
  );
  const showEditor = editorFiles.activeTabId !== CONSOLE_TAB_ID && !!activeFile;

  useEffect(() => {
    if (!editorReady || !activeFile) return;
    // onReady() fires as soon as the DOM content mounts, but Android's native
    // WebView can take anywhere from ~100ms to a couple of seconds (device-
    // dependent) to actually finish attaching after that — calling an
    // imperative method before it has fails with "Unable to find the ... view
    // with tag N". There's no reliable "attached" signal to await instead, so
    // retry across a spread of delays: setActiveFile no-ops immediately if the
    // file is already active, so whichever attempt lands first after the
    // WebView is ready wins and the rest are harmless no-ops.
    const timers = [100, 300, 700, 1500, 3000].map((ms) =>
      setTimeout(() => {
        editorRef.current?.setActiveFile(
          activeFile.id,
          activeFile.content,
          activeFile.language,
        );
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [editorReady, activeFile?.id]);

  useEffect(() => {
    if (!showEditor) {
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [showEditor]);

  const handleBack = () => {
    editorRef.current?.flush();
    router.back();
  };

  const handleRun = (mode: RunMode) => {
    editorFiles.setActiveTab(CONSOLE_TAB_ID);
    editorRef.current?.flushAndRun(mode);
  };

  // Closing a tab keeps its cached EditorState (undo history, cursor) around in
  // CodeEditor in case the file is reopened — only deleteFile actually disposes it.
  const closeTab = (id: string) => {
    editorFiles.closeTab(id);
  };

  // CodeMirror's focused element lives inside the WebView, outside RN's
  // responder chain, so presenting a sheet doesn't automatically close its
  // keyboard — blur it first or the sheet renders hidden behind the keyboard.
  // The keyboard-close animation is async, and @gorhom/bottom-sheet also
  // reacts to keyboard events internally, so present() needs a beat to avoid
  // presenting mid-transition (which can make the sheet fail to show at all).
  const presentSheet = (ref: RefObject<BottomSheetModal | null>) => {
    editorRef.current?.blur();
    setTimeout(() => ref.current?.present(), 80);
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "#000000",
        paddingTop: insets.top,
        paddingBottom: keyboardVisible ? 0 : insets.bottom,
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <EditorHeader
        fileName={showEditor ? activeFile?.name : "Console"}
        isDirty={!!activeFile && editorFiles.dirtyIds.has(activeFile.id)}
        canUndo={canUndo}
        canRedo={canRedo}
        onBack={handleBack}
        onUndo={() => editorRef.current?.undo()}
        onRedo={() => editorRef.current?.redo()}
        onPressRun={() => presentSheet(runSheetRef)}
        onPressMenu={() => presentSheet(menuSheetRef)}
      />

      <TabStrip
        files={editorFiles.files}
        openTabs={editorFiles.openTabs}
        activeTabId={editorFiles.activeTabId}
        dirtyIds={editorFiles.dirtyIds}
        runStatus={runSession.status}
        onSelectTab={editorFiles.setActiveTab}
        onCloseTab={closeTab}
        onPressAdd={() => {
          setNewFileMode("create");
          presentSheet(newFileSheetRef);
        }}
      />

      <View style={{ flex: 1, display: showEditor ? "flex" : "none" }}>
        <CodeEditor
          ref={editorRef}
          onReady={async () => setEditorReady(true)}
          onDirtyChange={async (fileId, dirty) =>
            editorFiles.markDirty(fileId, dirty)
          }
          onHistoryChange={async (nextCanUndo, nextCanRedo) => {
            setCanUndo(nextCanUndo);
            setCanRedo(nextCanRedo);
          }}
          onSaveContent={async (fileId, text) =>
            editorFiles.commitContent(fileId, text)
          }
          onRunReady={async (mode) =>
            runSession.start(editorFiles.project, mode)
          }
          dom={{
            style: { flex: 1 },
            scrollEnabled: false,
            hideKeyboardAccessoryView: true,
            contentInsetAdjustmentBehavior: "never",
          }}
        />
      </View>

      {editorFiles.activeTabId === CONSOLE_TAB_ID && (
        <ConsoleBody
          mode={runSession.mode}
          status={runSession.status}
          progress={runSession.progress}
          logs={runSession.logs}
          onClear={runSession.clear}
        />
      )}

      {showEditor && (
        <SymbolBar
          language={activeFile!.language}
          onInsertText={(text) => editorRef.current?.insertText(text)}
          onInsertPair={(open, close) =>
            editorRef.current?.insertPair(open, close)
          }
          onIndent={() => editorRef.current?.indent()}
          onDelete={() => editorRef.current?.deleteForward()}
        />
      )}

      <SelectBottomSheet
        ref={runSheetRef}
        title="Run"
        options={RUN_OPTIONS}
        value=""
        onSelect={(value) => {
          runSheetRef.current?.dismiss();
          handleRun(value as RunMode);
        }}
      />

      <NewFileSheet
        ref={newFileSheetRef}
        mode={newFileMode}
        initialValue={newFileMode === "rename" ? activeFile?.name : undefined}
        closedFiles={editorFiles.closedFiles}
        onCreate={(name) => editorFiles.createFile(name)}
        onRename={(name) =>
          activeFile && editorFiles.renameFile(activeFile.id, name)
        }
        onOpenExisting={(id) => editorFiles.openFile(id)}
        onDismiss={() => newFileSheetRef.current?.dismiss()}
      />

      <EditorMenuSheet
        ref={menuSheetRef}
        fileName={activeFile?.name}
        onFind={() => {
          menuSheetRef.current?.dismiss();
          if (showEditor) editorRef.current?.openSearch();
        }}
        onRename={() => {
          menuSheetRef.current?.dismiss();
          setNewFileMode("rename");
          presentSheet(newFileSheetRef);
        }}
        onDelete={() => {
          if (activeFile) {
            editorRef.current?.disposeFile(activeFile.id);
            editorFiles.deleteFile(activeFile.id);
          }
          menuSheetRef.current?.dismiss();
        }}
        onCloseTab={() => {
          if (activeFile) closeTab(activeFile.id);
          menuSheetRef.current?.dismiss();
        }}
        onDismiss={() => {}}
      />
    </KeyboardAvoidingView>
  );
}
