import Text from "@/components/Text";
import type { FileLanguage } from "@/constants/mock-projects";
import { Fonts } from "@/constants/theme";
import { Pressable, ScrollView } from "react-native";

type SymbolKey =
  | { label: string; kind: "indent" }
  | { label: string; kind: "delete" }
  | { label: string; kind: "pair"; open: string; close: string }
  | { label: string; kind: "text"; text: string };

const SYMBOLS_BY_LANGUAGE: Record<FileLanguage, SymbolKey[]> = {
  python: [
    { label: "Tab", kind: "indent" },
    { label: "Del", kind: "delete" },
    { label: "(", kind: "pair", open: "(", close: ")" },
    { label: "[", kind: "pair", open: "[", close: "]" },
    { label: ":", kind: "text", text: ":" },
    { label: "#", kind: "text", text: "#" },
    { label: '"', kind: "pair", open: '"', close: '"' },
    { label: "=", kind: "text", text: "=" },
    { label: "_", kind: "text", text: "_" },
  ],
  cpp: [
    { label: "Tab", kind: "indent" },
    { label: "Del", kind: "delete" },
    { label: "{", kind: "pair", open: "{", close: "}" },
    { label: "(", kind: "pair", open: "(", close: ")" },
    { label: ";", kind: "text", text: ";" },
    { label: '"', kind: "pair", open: '"', close: '"' },
    { label: "=", kind: "text", text: "=" },
    { label: "&", kind: "text", text: "&" },
    { label: "*", kind: "text", text: "*" },
    { label: "_", kind: "text", text: "_" },
  ],
  plain: [
    { label: "Tab", kind: "indent" },
    { label: "Del", kind: "delete" },
    { label: "{", kind: "pair", open: "{", close: "}" },
    { label: "[", kind: "pair", open: "[", close: "]" },
    { label: ":", kind: "text", text: ":" },
    { label: ",", kind: "text", text: "," },
    { label: '"', kind: "pair", open: '"', close: '"' },
    { label: "-", kind: "text", text: "-" },
    { label: "_", kind: "text", text: "_" },
  ],
};

export default function SymbolBar({
  language,
  onInsertText,
  onInsertPair,
  onIndent,
  onDelete,
}: {
  language: FileLanguage;
  onInsertText: (text: string) => void;
  onInsertPair: (open: string, close: string) => void;
  onIndent: () => void;
  onDelete: () => void;
}) {
  const keys = SYMBOLS_BY_LANGUAGE[language];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      style={{ flexGrow: 0, flexShrink: 0 }}
      className="border-t border-zinc-800 bg-element"
      contentContainerClassName="items-center gap-1.5 px-2 py-1.5"
    >
      {keys.map((key) => (
        <Pressable
          key={key.label}
          onPress={() => {
            if (key.kind === "indent") onIndent();
            else if (key.kind === "delete") onDelete();
            else if (key.kind === "pair") onInsertPair(key.open, key.close);
            else onInsertText(key.text);
          }}
          className="min-w-[36px] items-center justify-center rounded-lg bg-background px-2.5 py-2 active:bg-selected"
        >
          <Text
            style={{ fontFamily: Fonts?.mono }}
            className="text-sm text-primary"
          >
            {key.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
