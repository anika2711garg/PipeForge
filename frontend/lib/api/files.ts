import { apiGet } from "./client";
import type { FilePreview, IncomingFile } from "./types";

export function fetchFiles(): Promise<IncomingFile[]> {
  return apiGet<IncomingFile[]>("/api/files");
}

export function fetchFilePreview(filename: string, lines = 20): Promise<FilePreview> {
  const params = new URLSearchParams({ lines: String(lines) });
  return apiGet<FilePreview>(`/api/files/${encodeURIComponent(filename)}/preview?${params.toString()}`);
}
