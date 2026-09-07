import { describe, expect, it } from "vitest";

import { escapeCsvValue, toCsv } from "./csv";

describe("csv helpers", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvValue("plain")).toBe("plain");
    expect(escapeCsvValue("a,b")).toBe('"a,b"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
  });

  it("builds a csv snapshot", () => {
    expect(toCsv(["id", "name"], [[1, "alpha"], [2, "be,ta"]])).toBe(
      'id,name\n1,alpha\n2,"be,ta"\n',
    );
  });
});
