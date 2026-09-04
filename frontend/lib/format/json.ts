export type ParsedRaw =
  | { kind: "json"; value: unknown; text: string }
  | { kind: "text"; text: string };

export function inspectRawRecord(raw: string): ParsedRaw {
  try {
    const value: unknown = JSON.parse(raw);
    return { kind: "json", value, text: JSON.stringify(value, null, 2) };
  } catch {
    return { kind: "text", text: raw };
  }
}
