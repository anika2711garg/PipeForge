import { describe, expect, it } from "vitest";

import { inspectRawRecord } from "./json";

describe("inspectRawRecord", () => {
  it("pretty-prints valid JSON without treating it as HTML", () => {
    const result = inspectRawRecord('{"event_id":"evt_1"}');
    expect(result.kind).toBe("json");
    expect(result.text).toContain('"event_id"');
  });

  it("keeps malformed JSON as plain text", () => {
    const result = inspectRawRecord("{this is not valid json");
    expect(result.kind).toBe("text");
    expect(result.text).toBe("{this is not valid json");
  });
});
