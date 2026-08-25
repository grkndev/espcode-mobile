export type PartitionEntry = {
  name: string;
  type: string;
  offset: string;
  size: string;
};

const PARTITION_MAGIC = 0xaa50;
const ENTRY_SIZE = 32;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function decodeLabel(bytes: Uint8Array): string {
  const nullIndex = bytes.indexOf(0);
  const trimmed = nullIndex === -1 ? bytes : bytes.slice(0, nullIndex);
  return new TextDecoder().decode(trimmed);
}

/** Parses the ESP-IDF partition table binary format - not something esptool-js provides. */
export function parsePartitionTable(bytes: Uint8Array): PartitionEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries: PartitionEntry[] = [];

  for (let offset = 0; offset + ENTRY_SIZE <= bytes.length; offset += ENTRY_SIZE) {
    // Big-endian: ESP-IDF's gen_esp32part.py treats the magic as a raw
    // 2-byte string b'\xaa\x50' (not a packed little-endian number like the
    // offset/size fields below), so byte[offset] is 0xAA and byte[offset+1]
    // is 0x50 - reading little-endian here would look for 0x50AA instead
    // and never match.
    if (view.getUint16(offset, false) !== PARTITION_MAGIC) break;

    const type = bytes[offset + 2];
    const partOffset = view.getUint32(offset + 4, true);
    const size = view.getUint32(offset + 8, true);
    const label = decodeLabel(bytes.subarray(offset + 12, offset + 28));

    entries.push({
      name: label,
      type: type === 0x00 ? "app" : type === 0x01 ? "data" : `0x${type.toString(16)}`,
      offset: `0x${partOffset.toString(16)}`,
      size: formatBytes(size),
    });
  }

  return entries;
}
