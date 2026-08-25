export type FileLanguage = "python" | "cpp" | "plain";

export type FileMeta = {
  id: string;
  name: string;
  language: FileLanguage;
  content: string;
};

export type MockProject = {
  id: string;
  name: string;
  board: string;
  branch: string;
  files: FileMeta[];
};

function languageFromName(name: string): FileLanguage {
  if (name.endsWith(".py")) return "python";
  if (name.endsWith(".cpp") || name.endsWith(".h") || name.endsWith(".ino")) return "cpp";
  return "plain";
}

function file(id: string, name: string, content: string): FileMeta {
  return { id, name, language: languageFromName(name), content };
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "prj-001",
    name: "test",
    board: "ESP32-S3",
    branch: "main",
    files: [
      file(
        "main.py",
        "main.py",
        [
          "import network",
          "import time",
          "",
          "def connect(ssid, password):",
          "    wlan = network.WLAN(network.STA_IF)",
          "    wlan.active(True)",
          "    wlan.connect(ssid, password)",
          "    while not wlan.isconnected():",
          "        time.sleep(0.5)",
          "    print('connected:', wlan.ifconfig())",
          "",
          "connect('my-wifi', 'secret')",
          "",
        ].join("\n"),
      ),
      file(
        "boot.py",
        "boot.py",
        [
          "# boot.py runs on every boot, before main.py",
          "import gc",
          "import esp",
          "",
          "esp.osdebug(None)",
          "gc.collect()",
          "",
        ].join("\n"),
      ),
      file(
        "config.json",
        "config.json",
        JSON.stringify({ ssid: "my-wifi", interval_ms: 500 }, null, 2) + "\n",
      ),
    ],
  },
];

export function getMockProject(projectId?: string | null): MockProject {
  return MOCK_PROJECTS.find((p) => p.id === projectId) ?? MOCK_PROJECTS[0];
}
