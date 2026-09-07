import { describe, expect, it } from "vitest";

import { formatPercent, integerPercent } from "./rates";

describe("rate helpers", () => {
  it("uses integer division only", () => {
    expect(integerPercent(1, 3)).toBe(33);
    expect(integerPercent(0, 10)).toBe(0);
    expect(integerPercent(4, 0)).toBeNull();
    expect(integerPercent(null, 10)).toBeNull();
  });

  it("formats warehouse percents", () => {
    expect(formatPercent(33)).toBe("33%");
    expect(formatPercent(null)).toBe("—");
  });
});
