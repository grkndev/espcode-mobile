# Editor Screen Design

Date: 2026-08-25
Screen: `src/app/(protected)/(screens)/editor/index.tsx`

## Purpose

A code editor screen for writing the source code of a "Project" (as listed on
the Home screen) before it's flashed to an ESP32/ESP8266 device. This is
distinct from the device filesystem browser in Tools > Filesystem — that
screen manages files living on the chip's LittleFS; this screen manages the
project's local source files (e.g. `main.py`, `boot.py`, an Arduino sketch).
The two are not synced or merged.

## Scope for v1

- Multiple files per project, opened into a tab strip (no separate file-tree
  explorer — a `+` action opens/creates files from a lightweight sheet).
- MicroPython and Arduino/C++ both supported; syntax mode is picked from the
  active file's extension, not a project-level language setting.
- Data is mock/in-memory for now, but routed through a single hook so a real
  local (AsyncStorage / `expo-file-system`) or cloud storage backend can be
  swapped in later without touching UI code.
- Compiling/uploading to the device happens **in place** on this screen (no
  navigation to a separate screen) via a pinned Console tab with a progress
  bar and streamed logs.

## Layout

```
┌─────────────────────────────────────┐
│ ← main.py ●   ⌄        [↩] [↪]  ⋯   │  header
├───────────────────────────────────────
│ [main.py] [boot.py] [+] … [⚙Console] │  tab strip (pinned Console tab)
├─────────────────────────────────────┤
│  1  import network                   │
│  2  import time                      │
│  ⋮                                   │  CodeMirror body, or Console body
├─────────────────────────────────────┤
│ Tab {  }  (  )  [  ]  "  ;  :  #  →ˡ │  symbol row (hidden on Console tab)
├─────────────────────────────────────┤
│         [native keyboard]            │
└─────────────────────────────────────┘
        floating: [Save] [Upload ▲]      hidden on Console tab
```

- **Header**: back chevron, active filename + unsaved-changes dot, tab
  picker chevron (when tabs overflow), Undo/Redo icon buttons, `⋯` overflow
  menu (Find in file, Rename, Delete, Close tab).
- **Tab strip**: horizontally scrollable pills for *open* files only, each
  closable; trailing `+` opens `NewFileSheet` (create new / open another
  project file). A **pinned, non-closable `⚙ Console` tab** always sits at
  the end.
- **Editor body**: `CodeEditor` DOM component (CodeMirror) when a file tab
  is active; `ConsoleBody` when the Console tab is active.
- **Symbol row**: one-tap insert row above the keyboard, keys prioritized
  per active file's language; bracket keys insert pairs and place the
  cursor between them. Hidden while Console tab is active.
- **Save / Upload**: floating buttons, bottom-right, above the symbol row.
  Hidden while Console tab is active.

## Component & data architecture

```
src/app/(protected)/(screens)/editor/index.tsx   — screen (reads ?project=)
src/dom-components/CodeEditor.tsx                — "use dom" CodeMirror wrapper
src/hooks/use-editor-files.ts                     — data-access hook (mock-backed)
src/hooks/use-upload-session.ts                   — build/upload state, independent of active tab
src/components/editor/EditorHeader.tsx
src/components/editor/TabStrip.tsx
src/components/editor/SymbolBar.tsx
src/components/editor/NewFileSheet.tsx
src/components/editor/ConsoleBody.tsx             — reuses Monitor's ConsoleView styling
src/constants/mock-projects.ts                    — mock project/file seed data
```

### `useEditorFiles(projectId)`

The storage seam. Backed today by `useState` seeded from
`mock-projects.ts` (same pattern as `filesystem.tsx` / `monitor.tsx`), but
all mutation goes through its functions so a future storage provider
(local FS vs. cloud) can replace the internals without changing any
component:

```ts
{
  project: { id, name, board, files: FileMeta[] },
  openTabs: string[],
  activeFileId: string,          // a file id, or 'console'
  activeContent: string,
  isDirty: boolean,
  isAnyDirty: boolean,
  openFile(id), closeTab(id), setActiveTab(id),
  createFile(name), renameFile(id, name), deleteFile(id),
  updateContent(text), saveActiveFile(), saveAll(),
}
```

### `useUploadSession()`

Independent of tab state so an upload keeps running/streaming logs even if
the user switches back to a file tab. Exposes `status` (`idle | compiling |
uploading | verifying | success | error`), `progress` (0-100), `logs:
LogLine[]`, and `start(project)`.

### `CodeEditor.tsx` ("use dom")

Wraps `@uiw/react-codemirror` with `@codemirror/lang-python` and
`@codemirror/lang-cpp`, chosen by the active file's extension. Themed with
`Colors.dark` values (purple cursor/selection) instead of CodeMirror's
default theme. Requires adding `react-native-webview` (Expo DOM component
dependency) — follow the `use-dom` skill for the exact SDK 57 setup at
implementation time.

## Interactions

- **Editing** → `onChange` → `updateContent()`, sets `isDirty`; header dot
  reflects it live.
- **Save** → `saveActiveFile()`; haptic + brief check flash on the button.
  No navigation, no Console involvement.
- **Upload** → auto-saves any dirty file → switches active tab to
  `console` → `useUploadSession().start(project)`. Progress bar (reusing
  the `ProgressBar` component from `filesystem.tsx`) renders under the
  header showing stage + percent. Log lines reuse Monitor's `ConsoleView`
  styling (13px mono, per-level color). A dot on the Console pill pulses
  while running and flashes green/red on completion, visible even when
  a file tab is active.
- **Undo/Redo** → CodeMirror history commands via the DOM bridge.
- **Search** → `⋯` → "Find in file" opens CodeMirror's built-in search
  panel (`@codemirror/search`).
- **Closing a dirty tab** → inline confirm ("Unsaved changes — Discard /
  Save") before removing from `openTabs`.
- **Back navigation with unsaved changes** → single confirm covering all
  dirty tabs ("N files have unsaved changes — Discard / Save all").

## Visual design

Matches the app's existing dark-tech surfaces (`monitor.tsx`,
`filesystem.tsx`, Home's `ProjectCard`): background near-black, cards
`#12181D` on `#2A3239` borders, purple `#9333ea`/`purple-700` as the single
accent, DM Sans for UI text, mono font for code/logs. Active tab pill uses
Monitor's underline-tab treatment; Console tab gets a distinct
icon+label pill (`IconTerminal2`) so it doesn't blend with file tabs.
Save = ghost `bg-element` pill; Upload = solid purple pill, matching
Monitor's Start/Pause button. Progress bar and console log styling are
reused 1:1 from `filesystem.tsx` and `monitor.tsx` respectively, so the
"device operation in progress" language stays consistent across the app.

## Edge cases

- Missing/unknown `?project=` param → fall back to the first mock project.
- Empty project → empty state in the code area ("No files yet" + Create
  file), Console tab still selectable.
- All file tabs closed → `activeFileId` falls back to `console`, not blank.
- Duplicate/invalid filenames rejected inline in `NewFileSheet`.
- Concurrent upload taps are a no-op while `status !== 'idle'`; button
  shows a disabled spinner label.
- Upload failure → red log lines + red progress bar, button re-enables for
  retry.
- CodeMirror DOM component first paint may blank-flash (WebView-backed) →
  show a centered spinner until it signals ready.
- Multi-line editor + symbol row above keyboard needs real
  `KeyboardAvoidingView` handling per platform (iOS `padding` vs Android
  `height`/resize) — Monitor's single-line input didn't need this.

## Entry point

Home's `ProjectCard` "Open" row becomes a `Link` to
`/(protected)/(screens)/editor?project=<id>`.
