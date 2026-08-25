"use dom";

import type { FileLanguage } from "@/constants/mock-projects";
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import {
  HighlightStyle,
  bracketMatching,
  foldGutter,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  redo as cmRedo,
  redoDepth,
  undo as cmUndo,
  undoDepth,
  deleteCharForward,
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { highlightSelectionMatches, openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import { useDOMImperativeHandle, type DOMImperativeFactory } from "expo/dom";
import { useEffect, useRef, type Ref } from "react";

export type RunMode = "compile" | "upload";

/**
 * `DOMImperativeFactory`'s index signature (`(...args: JSONValue[]) => void`)
 * can't structurally accept specifically-typed methods, so this ref type is
 * intentionally NOT an extension of it — it's the type native code sees via
 * `useRef<CodeEditorRef>`. The `useDOMImperativeHandle` call below targets
 * `DOMImperativeFactory` directly and casts.
 */
export interface CodeEditorRef {
  setActiveFile: (fileId: string, text: string, language: FileLanguage) => void;
  disposeFile: (fileId: string) => void;
  insertText: (text: string) => void;
  insertPair: (open: string, close: string) => void;
  indent: () => void;
  deleteForward: () => void;
  undo: () => void;
  redo: () => void;
  openSearch: () => void;
  /** Flushes the active file's pending auto-save immediately, e.g. before navigating back. */
  flush: () => void;
  /** Defocuses CodeMirror so the WebView-hosted keyboard closes, e.g. before presenting a sheet. */
  blur: () => void;
  flushAndRun: (mode: RunMode) => void;
}

interface Props {
  ref?: Ref<CodeEditorRef>;
  onReady: () => Promise<void>;
  onDirtyChange: (fileId: string, dirty: boolean) => Promise<void>;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => Promise<void>;
  onSaveContent: (fileId: string, text: string) => Promise<void>;
  onRunReady: (mode: RunMode) => Promise<void>;
  dom?: import("expo/dom").DOMProps;
}

const COLORS = {
  background: "#000000",
  gutterBg: "#000000",
  gutterText: "#52525b",
  text: "#e4e4e7",
  activeLine: "#0a0a0a",
  selection: "rgba(147, 51, 234, 0.28)",
  cursor: "#a855f7",
  matchingBracket: "rgba(168, 85, 247, 0.35)",
};

const MONO_FONT_STACK =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

const SYNTAX_COLORS = {
  keyword: "#c084fc",
  string: "#4ade80",
  comment: "#71717a",
  number: "#fbbf24",
  function: "#60a5fa",
  variable: "#e4e4e7",
  operator: "#a1a1aa",
  property: "#f0abfc",
};

function indentUnitFor(language: FileLanguage): string {
  return language === "python" ? "    " : "  ";
}

function languageExtension(language: FileLanguage): Extension[] {
  if (language === "python") return [python()];
  if (language === "cpp") return [cpp()];
  return [];
}

const editorTheme = EditorView.theme(
  {
    "&": {
      color: COLORS.text,
      backgroundColor: COLORS.background,
      height: "100%",
      fontSize: "14px",
    },
    ".cm-content": {
      fontFamily: MONO_FONT_STACK,
      caretColor: COLORS.cursor,
      paddingBottom: "120px",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: COLORS.cursor },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: `${COLORS.selection} !important`,
    },
    ".cm-gutters": {
      backgroundColor: COLORS.gutterBg,
      color: COLORS.gutterText,
      border: "none",
    },
    ".cm-activeLineGutter, .cm-activeLine": {
      backgroundColor: COLORS.activeLine,
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: COLORS.matchingBracket,
      outline: "none",
    },
    ".cm-scroller": { overflow: "auto", WebkitOverflowScrolling: "touch" },
    ".cm-panels": {
      backgroundColor: "#12181D",
      color: COLORS.text,
      borderTop: "1px solid #2A3239",
    },
    ".cm-panels input": {
      backgroundColor: "#000000",
      color: COLORS.text,
      border: "1px solid #2A3239",
      borderRadius: "6px",
    },
  },
  { dark: true },
);

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: SYNTAX_COLORS.keyword },
  { tag: [t.function(t.variableName), t.labelName], color: SYNTAX_COLORS.function },
  { tag: [t.typeName, t.className, t.namespace, t.self, t.modifier], color: SYNTAX_COLORS.function },
  { tag: [t.name, t.deleted, t.character, t.macroName, t.definition(t.name)], color: SYNTAX_COLORS.variable },
  { tag: [t.number, t.bool, t.constant(t.name)], color: SYNTAX_COLORS.number },
  { tag: [t.operator, t.operatorKeyword], color: SYNTAX_COLORS.operator },
  { tag: [t.string, t.url, t.escape, t.regexp], color: SYNTAX_COLORS.string },
  { tag: t.propertyName, color: SYNTAX_COLORS.property },
  { tag: [t.comment, t.meta], color: SYNTAX_COLORS.comment, fontStyle: "italic" },
  { tag: t.invalid, color: "#f87171" },
]);

const syntaxTheme = syntaxHighlighting(highlightStyle, { fallback: true });

type Handlers = {
  onDocChanged: (fileId: string) => void;
  onHistory: (canUndo: boolean, canRedo: boolean) => void;
};

function baseExtensions(fileId: string, language: FileLanguage, handlers: Handlers): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    indentUnit.of(indentUnitFor(language)),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search({ top: true }),
    syntaxTheme,
    editorTheme,
    EditorView.lineWrapping,
    ...languageExtension(language),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        handlers.onDocChanged(fileId);
        handlers.onHistory(undoDepth(update.state) > 0, redoDepth(update.state) > 0);
      }
    }),
  ];
}

export default function CodeEditor({ ref, onReady, onDirtyChange, onHistoryChange, onSaveContent, onRunReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const statesRef = useRef<Map<string, EditorState>>(new Map());
  const activeFileIdRef = useRef<string | null>(null);
  const languageRef = useRef<FileLanguage>("plain");
  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onReadyRef = useRef(onReady);
  const onDirtyChangeRef = useRef(onDirtyChange);
  const onHistoryChangeRef = useRef(onHistoryChange);
  const onSaveContentRef = useRef(onSaveContent);
  const onRunReadyRef = useRef(onRunReady);
  onReadyRef.current = onReady;
  onDirtyChangeRef.current = onDirtyChange;
  onHistoryChangeRef.current = onHistoryChange;
  onSaveContentRef.current = onSaveContent;
  onRunReadyRef.current = onRunReady;

  function flushActive() {
    const view = viewRef.current;
    const fileId = activeFileIdRef.current;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!view || !fileId || !dirtyRef.current) return;
    const text = view.state.doc.toString();
    dirtyRef.current = false;
    onSaveContentRef.current(fileId, text).catch(() => {});
    onDirtyChangeRef.current(fileId, false).catch(() => {});
  }

  function handleDocChanged(fileId: string) {
    if (fileId !== activeFileIdRef.current) return;
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      onDirtyChangeRef.current(fileId, true).catch(() => {});
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushActive, 800);
  }

  function handleHistory(canUndo: boolean, canRedo: boolean) {
    onHistoryChangeRef.current(canUndo, canRedo).catch(() => {});
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const view = new EditorView({
      state: EditorState.create({ doc: "", extensions: [editorTheme] }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    onReadyRef.current().catch(() => {});
    return () => {
      flushActive();
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDOMImperativeHandle(
    ref as unknown as Ref<DOMImperativeFactory>,
    () => {
      const setActiveFile = (fileId: string, text: string, language: FileLanguage) => {
        const view = viewRef.current;
        if (!view || activeFileIdRef.current === fileId) return;

        if (activeFileIdRef.current) {
          flushActive();
          statesRef.current.set(activeFileIdRef.current, view.state);
        }

        let nextState = statesRef.current.get(fileId);
        if (!nextState) {
          nextState = EditorState.create({
            doc: text,
            extensions: baseExtensions(fileId, language, {
              onDocChanged: handleDocChanged,
              onHistory: handleHistory,
            }),
          });
          statesRef.current.set(fileId, nextState);
        }

        activeFileIdRef.current = fileId;
        languageRef.current = language;
        dirtyRef.current = false;
        view.setState(nextState);
        view.focus();
        handleHistory(undoDepth(nextState) > 0, redoDepth(nextState) > 0);
      };

      const disposeFile = (fileId: string) => {
        statesRef.current.delete(fileId);
      };

      const insertText = (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch(
          view.state.changeByRange((range) => ({
            changes: { from: range.from, to: range.to, insert: text },
            range: EditorSelection.cursor(range.from + text.length),
          })),
        );
        view.focus();
      };

      const insertPair = (open: string, close: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch(
          view.state.changeByRange((range) => {
            if (!range.empty) {
              const selected = view.state.sliceDoc(range.from, range.to);
              return {
                changes: { from: range.from, to: range.to, insert: open + selected + close },
                range: EditorSelection.range(
                  range.from + open.length,
                  range.from + open.length + selected.length,
                ),
              };
            }
            return {
              changes: { from: range.from, to: range.to, insert: open + close },
              range: EditorSelection.cursor(range.from + open.length),
            };
          }),
        );
        view.focus();
      };

      const indent = () => {
        const view = viewRef.current;
        if (!view) return;
        const unit = indentUnitFor(languageRef.current);
        view.dispatch(
          view.state.changeByRange((range) => ({
            changes: { from: range.from, to: range.to, insert: unit },
            range: EditorSelection.cursor(range.from + unit.length),
          })),
        );
        view.focus();
      };

      const deleteForward = () => {
        const view = viewRef.current;
        if (view) deleteCharForward(view);
      };

      const undo = () => {
        const view = viewRef.current;
        if (view) cmUndo(view);
      };

      const redo = () => {
        const view = viewRef.current;
        if (view) cmRedo(view);
      };

      const openSearch = () => {
        const view = viewRef.current;
        if (view) openSearchPanel(view);
      };

      const flush = () => {
        flushActive();
      };

      const flushAndRun = (mode: RunMode) => {
        flushActive();
        onRunReadyRef.current(mode).catch(() => {});
      };

      // Defocuses CodeMirror so the WebView-hosted keyboard closes — needed
      // before presenting a native bottom sheet, since it has no way to know
      // a focused element inside the WebView exists to blur.
      const blur = () => {
        flushActive();
        viewRef.current?.contentDOM.blur();
      };

      return {
        setActiveFile,
        disposeFile,
        insertText,
        insertPair,
        indent,
        deleteForward,
        undo,
        redo,
        openSearch,
        flush,
        flushAndRun,
        blur,
      } as unknown as DOMImperativeFactory;
    },
    [],
  );

  return (
    <>
      <style>{`
        html, body { height: 100%; margin: 0; padding: 0; background: ${COLORS.background}; overscroll-behavior: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div ref={containerRef} style={{ position: "fixed", inset: 0 }} />
    </>
  );
}
