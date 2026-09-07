export function integerPercent(part: number | null | undefined, whole: number | null | undefined): number | null {
  if (part == null || whole == null || !Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) {
    return null;
  }
  return Math.trunc((Math.trunc(part) * 100) / Math.trunc(whole));
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return `${Math.trunc(value)}%`;
}
