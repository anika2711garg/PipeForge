import { describe, expect, it } from "vitest";

import { formatDuration, formatTimestamp } from "./dates";

describe("date helpers", () => {
  it("formats UTC timestamps with a Z suffix", () => {
    expect(formatTimestamp("2026-08-04T19:00:00Z", "utc")).toBe("2026-08-04T19:00:00Z");
  });

  it("returns em dash for empty values", () => {
    expect(formatTimestamp(null)).toBe("—");
    expect(formatDuration(null, "2026-08-04T19:00:01Z")).toBe("—");
  });

  it("formats short durations in milliseconds", () => {
    expect(formatDuration("2026-08-04T19:00:00.000Z", "2026-08-04T19:00:00.120Z")).toBe(
      "120 ms",
    );
  });
});
