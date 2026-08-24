import Icons from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import Text from "@/components/Text";
import ToolScreenModal from "@/components/ToolScreenModal";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";

type FileEntry = { id: string; name: string; ext: string; size: string; bytes: number };

const INITIAL_FILES: FileEntry[] = [
  { id: "1", name: "config.json", ext: "JSON", size: "2.1 KB", bytes: 2150 },
  { id: "2", name: "index.html", ext: "HTML", size: "8.4 KB", bytes: 8600 },
  { id: "3", name: "style.css", ext: "CSS", size: "1.2 KB", bytes: 1230 },
  { id: "4", name: "calibration.bin", ext: "BIN", size: "64 KB", bytes: 65536 },
  { id: "5", name: "secrets.txt", ext: "TXT", size: "0.3 KB", bytes: 310 },
];

const CAPACITY_BYTES = 1_500_000;

const EXT_COLOR: Record<string, string> = {
  JSON: "#facc15",
  HTML: "#fb923c",
  CSS: "#60a5fa",
  BIN: "#a78bfa",
  TXT: "#71717a",
};

let nextId = INITIAL_FILES.length + 1;

function FilesystemBody() {
  const [files, setFiles] = useState(INITIAL_FILES);

  const usedBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const usedPct = (usedBytes / CAPACITY_BYTES) * 100;

  const addMockFile = () => {
    const id = `${nextId++}`;
    setFiles((prev) => [...prev, { id, name: `upload-${id}.log`, ext: "TXT", size: "4.0 KB", bytes: 4096 }]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <View className="flex-1">
      <View className="gap-2 px-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-secondary">
            {(usedBytes / 1000).toFixed(1)} KB of {(CAPACITY_BYTES / 1_000_000).toFixed(1)} MB used
          </Text>
          <Text className="text-xs text-zinc-600">{files.length} files</Text>
        </View>
        <ProgressBar progress={usedPct} />
      </View>

      <View className="flex-row items-center justify-between px-4 pt-5">
        <Text weight="semibold" className="text-xs uppercase tracking-wide text-zinc-600">
          LittleFS
        </Text>
        <Pressable onPress={addMockFile} className="flex-row items-center gap-1 rounded-lg bg-element px-3 py-1.5">
          <Icons name="IconPlus" color="#B0B4BA" size={14} />
          <Text className="text-xs text-secondary">Upload File</Text>
        </Pressable>
      </View>

      {files.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-10">
          <Icons name="IconFolderOpen" color="#3f3f46" size={32} />
          <Text weight="bold" className="mt-1 text-center text-base text-primary">
            No files on device
          </Text>
          <Text className="text-center text-sm text-secondary">Upload a file to see it listed here.</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2 p-4"
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 rounded-xl border border-[#2A3239] bg-[#12181D] p-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-element">
                <Text weight="bold" className="text-[9px]" style={{ color: EXT_COLOR[item.ext] ?? "#71717a" }}>
                  {item.ext}
                </Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text weight="semibold" className="text-primary">
                  {item.name}
                </Text>
                <Text className="text-xs text-secondary">{item.size}</Text>
              </View>
              <Pressable onPress={() => removeFile(item.id)} className="p-2">
                <Icons name="IconTrash" color="#71717a" size={16} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

export default function FilesystemScreen() {
  return (
    <ToolScreenModal title="File System">
      <FilesystemBody />
    </ToolScreenModal>
  );
}
