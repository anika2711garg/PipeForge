import { apiGet } from "./client";
import type { IncomingFile } from "./types";

export function fetchFiles(): Promise<IncomingFile[]> {
  return apiGet<IncomingFile[]>("/api/files");
}
