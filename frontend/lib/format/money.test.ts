import { describe, expect, it } from "vitest";

import { formatMinorUnitsExact, splitMinorUnits, sumMinorUnits } from "./money";

describe("money helpers", () => {
  it("sums only integer minor units", () => {
    expect(sumMinorUnits([10, 20, 1007, 9999])).toBe(11036);
    expect(sumMinorUnits([10, null, undefined, 20])).toBe(30);
  });

  it("splits cents without float remainder", () => {
    expect(splitMinorUnits(10)).toEqual({ negative: false, whole: "0", cents: "10" });
    expect(splitMinorUnits(20)).toEqual({ negative: false, whole: "0", cents: "20" });
    expect(splitMinorUnits(1007)).toEqual({ negative: false, whole: "10", cents: "07" });
    expect(splitMinorUnits(9999)).toEqual({ negative: false, whole: "99", cents: "99" });
  });

  it("formats exact decimal strings", () => {
    expect(formatMinorUnitsExact(10)).toBe("0.10");
    expect(formatMinorUnitsExact(20)).toBe("0.20");
    expect(formatMinorUnitsExact(1007)).toBe("10.07");
  });
});
