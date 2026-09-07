import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CatalogPage } from "@workspace/CatalogPage";
import { FIXTURES, oracleApply, oracleParse } from "../oracle";

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: "/", element: <CatalogPage /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

function resultNames() {
  const list = screen.getByRole("list", { name: "Product results" });
  return within(list)
    .queryAllByRole("listitem")
    .map((node) => node.textContent ?? "");
}

describe("URL-synchronized catalog UI", () => {
  it("restores results from a deep link", async () => {
    renderAt("/?category=kitchen&sort=price&order=asc");
    const expected = oracleApply(oracleParse("?category=kitchen&sort=price&order=asc"));
    expect(await screen.findByText(new RegExp(`${expected.total} products`))).toBeInTheDocument();
    for (const item of expected.items) {
      expect(screen.getByText(new RegExp(item.name))).toBeInTheDocument();
    }
  });

  it("updates the URL and results when searching", async () => {
    const user = userEvent.setup();
    const router = renderAt("/");
    await user.clear(screen.getByLabelText("Search"));
    await user.type(screen.getByLabelText("Search"), "lamp");
    expect(router.state.location.search).toMatch(/q=/i);
    const params = oracleParse(router.state.location.search);
    expect(params.q).toBe("lamp");
    expect(params.page).toBe(1);
    const expected = oracleApply(params);
    expect(resultNames().join("\n")).toContain(expected.items[0].name);
  });

  it("resets page to 1 when the category changes", async () => {
    const user = userEvent.setup();
    const router = renderAt("/?page=2");
    expect(oracleParse(router.state.location.search).page).toBe(2);
    await user.selectOptions(screen.getByLabelText("Category"), "audio");
    const params = oracleParse(router.state.location.search);
    expect(params.category).toBe("audio");
    expect(params.page).toBe(1);
    const expected = oracleApply(params);
    expect(resultNames().length).toBe(expected.items.length);
  });

  it("paginates with Previous/Next and keeps other params", async () => {
    const user = userEvent.setup();
    const router = renderAt("/?sort=name&order=asc");
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(oracleParse(router.state.location.search)).toMatchObject({ sort: "name", order: "asc", page: 2 });
    const page2 = oracleApply(oracleParse(router.state.location.search));
    expect(resultNames()[0]).toContain(page2.items[0].name);
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(oracleParse(router.state.location.search).page).toBe(1);
  });

  it("supports back/forward history", async () => {
    const user = userEvent.setup();
    const router = renderAt("/");
    await user.type(screen.getByLabelText("Search"), "mug");
    expect(oracleParse(router.state.location.search).q).toBe("mug");
    await user.selectOptions(screen.getByLabelText("Category"), "kitchen");
    expect(oracleParse(router.state.location.search).category).toBe("kitchen");
    router.navigate(-1);
    expect(oracleParse(router.state.location.search).q).toBe("mug");
    expect(oracleParse(router.state.location.search).category).toBe("");
    router.navigate(1);
    expect(oracleParse(router.state.location.search).category).toBe("kitchen");
  });

  it("shows an empty state for unmatched filters", async () => {
    renderAt("/?q=zzzz-no-match");
    expect(await screen.findByText(/No products match these filters/i)).toBeInTheDocument();
    expect(resultNames()).toEqual([]);
  });

  it("computes from fixtures rather than a hardcoded short list", () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(15);
    const all = oracleApply(oracleParse(""));
    expect(all.total).toBe(FIXTURES.length);
    renderAt("/");
    expect(resultNames().length).toBe(5);
    expect(resultNames()[0]).toContain(all.items[0].name);
  });
});
