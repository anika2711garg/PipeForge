import { describe, expect, it } from "vitest";

import {
  applyCatalog,
  parseParams,
  serializeParams,
} from "@workspace/lib/catalog";
import { FIXTURES, oracleApply, oracleParse, oracleSerialize } from "../oracle";

describe("catalog helpers vs independent oracle", () => {
  it("parses trimmed case-preserving q and defaults", () => {
    const parsed = parseParams("?q=%20Lamp%20&sort=nope&order=sideways&page=0&extra=1");
    const expected = oracleParse("?q=%20Lamp%20&sort=nope&order=sideways&page=0&extra=1");
    expect(parsed).toEqual(expected);
    expect(parsed.q).toBe("Lamp");
    expect(parsed.sort).toBe("name");
    expect(parsed.order).toBe("asc");
    expect(parsed.page).toBe(1);
  });

  it("serializes non-defaults and encodes special characters", () => {
    const params = {
      q: "cable & adapter",
      category: "accessories",
      sort: "price" as const,
      order: "desc" as const,
      page: 2,
      pageSize: 5,
    };
    expect(serializeParams(params)).toBe(oracleSerialize(params));
    const roundTrip = parseParams(`?${serializeParams(params)}`);
    expect(roundTrip.q).toBe("cable & adapter");
    expect(roundTrip.category).toBe("accessories");
    expect(roundTrip.sort).toBe("price");
    expect(roundTrip.order).toBe("desc");
    expect(roundTrip.page).toBe(2);
  });

  it("applies case-insensitive search against name and sku", () => {
    const params = oracleParse("?q=lamp");
    const got = applyCatalog(FIXTURES, parseParams("?q=lamp"));
    const expected = oracleApply(params);
    expect(got.items.map((item) => item.id)).toEqual(expected.items.map((item) => item.id));
    expect(got.total).toBe(2);
  });

  it("uses id ascending as a stable tiebreaker for equal prices", () => {
    const params = parseParams("?sort=price&order=asc");
    const got = applyCatalog(FIXTURES, params);
    const expected = oracleApply(oracleParse("?sort=price&order=asc"));
    expect(got.items.map((item) => item.id)).toEqual(expected.items.map((item) => item.id));
    // p02 and p10 both 1500; p02 before p10 by id
    const priced = expected.items.filter((item) => item.priceCents === 1500);
    if (priced.length >= 2) {
      expect(priced[0].id < priced[1].id).toBe(true);
    }
  });

  it("clamps oversized pages and empties unknown categories", () => {
    const empty = applyCatalog(FIXTURES, parseParams("?category=does-not-exist&page=9"));
    expect(empty.total).toBe(0);
    expect(empty.items).toEqual([]);
    expect(empty.page).toBe(1);

    const clamped = applyCatalog(FIXTURES, parseParams("?page=99"));
    const expected = oracleApply(oracleParse("?page=99"));
    expect(clamped.page).toBe(expected.page);
    expect(clamped.items.map((item) => item.id)).toEqual(expected.items.map((item) => item.id));
  });
});
