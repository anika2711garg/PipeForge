/** Integer-only summation of minor units. Never use binary floats for aggregation. */
export function sumMinorUnits(values: Iterable<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      total += Math.trunc(value);
    }
  }
  return total;
}

export function splitMinorUnits(minor: number): { negative: boolean; whole: string; cents: string } {
  const negative = minor < 0;
  const abs = Math.abs(Math.trunc(minor));
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  return {
    negative,
    whole: String(whole),
    cents: String(cents).padStart(2, "0"),
  };
}

export function formatMinorUnits(
  minor: number | null | undefined,
  currency?: string | null,
): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) {
    return "—";
  }
  const { negative, whole, cents } = splitMinorUnits(minor);
  const signed = `${negative ? "-" : ""}${whole}.${cents}`;
  const code = currency && currency !== "UNKNOWN" ? currency : null;
  if (!code) {
    return signed;
  }
  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(`${negative ? "-" : ""}${whole}.${cents}`));
    return formatted;
  } catch {
    return `${signed} ${code}`;
  }
}

export function formatMinorUnitsExact(minor: number | null | undefined): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) {
    return "—";
  }
  const { negative, whole, cents } = splitMinorUnits(minor);
  return `${negative ? "-" : ""}${whole}.${cents}`;
}
