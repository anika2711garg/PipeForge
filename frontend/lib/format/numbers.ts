export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat(undefined).format(Math.trunc(value));
}

export function shortenHash(value: string | null | undefined, size = 10): string {
  if (!value) {
    return "—";
  }
  return value.length > size + 1 ? `${value.slice(0, size)}…` : value;
}
