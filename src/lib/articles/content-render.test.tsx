import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderArticleContentBlocks } from "./content-render";

describe("renderArticleContentBlocks", () => {
  it("renders a heading and paragraph separately when they share a block", () => {
    render(
      <>
        {renderArticleContentBlocks(["# Delais importants\nGardez une preuve ecrite."], "article-test", {
          headingId: (heading) => `heading-${heading.toLowerCase().replace(/\s+/g, "-")}`,
        })}
      </>,
    );

    const heading = screen.getByRole("heading", { name: "Delais importants", level: 2 });
    expect(heading.id).toBe("heading-delais-importants");
    expect(screen.getByText("Gardez une preuve ecrite.").tagName).toBe("P");
  });

  it("renders mixed prose and bullet lines as separate paragraph and list elements", () => {
    render(
      <>
        {renderArticleContentBlocks(
          ["Preparez ces preuves:\n- Contrat de travail\n- Bulletins de paie"],
          "article-test",
        )}
      </>,
    );

    expect(screen.getByText("Preparez ces preuves:").tagName).toBe("P");
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(screen.getByText("Contrat de travail").tagName).toBe("LI");
    expect(screen.getByText("Bulletins de paie").tagName).toBe("LI");
  });

  it("keeps trailing punctuation outside external auto-links", () => {
    const { container } = render(
      <>
        {renderArticleContentBlocks(["Consultez https://example.com/test."], "article-test")}
      </>,
    );

    const link = screen.getByRole("link", { name: "https://example.com/test" });
    expect(link.getAttribute("href")).toBe("https://example.com/test");
    expect(container.textContent).toBe("Consultez https://example.com/test.");
  });
});
