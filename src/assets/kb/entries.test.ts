// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import { enhanceEntries } from "./entries";

const md = readFileSync(path.resolve(process.cwd(), "tests/fixtures/how-to-live-better-01.md"), "utf8")
  .replace(/^---[\s\S]*?---\n/, ""); // 去掉 frontmatter

describe("kb entries enhancement", () => {
  it("turns markdown entries into sections with badges and evidence", () => {
    document.body.innerHTML = `<div id="content">${new MarkdownIt({ html: true }).render(md)}</div>`;
    const content = document.getElementById("content")!;
    enhanceEntries(content);

    const entries = content.querySelectorAll("section.kb-entry");
    expect(entries.length).toBeGreaterThan(10);

    const first = entries[0];
    expect(first.querySelector(".kb-tags")).not.toBeNull();
    expect(first.querySelectorAll(".kb-tag").length).toBeGreaterThanOrEqual(4);
    expect(first.getAttribute("data-evidence")).toBe("A");
    expect(first.querySelector(".kb-evidence-a")?.textContent).toBe("A");
    expect(first.querySelector(".kb-field-plain")).not.toBeNull();

    // 成本标签原始段落被替换
    expect(content.textContent).not.toContain("成本标签：钱");

    // 筛选条
    const bar = content.querySelector(".kb-filter")!;
    expect(bar).not.toBeNull();
    (bar.querySelector('[data-grade="B"]') as HTMLButtonElement).click();
    const hidden = Array.from(entries).filter((e) => (e as HTMLElement).hidden).length;
    const visible = entries.length - hidden;
    expect(visible).toBe(Array.from(entries).filter((e) => e.getAttribute("data-evidence") === "B").length);
  });

  it("leaves ordinary articles untouched", () => {
    document.body.innerHTML = `<div id="content"><h2>普通标题</h2><p>普通段落</p></div>`;
    const content = document.getElementById("content")!;
    enhanceEntries(content);
    expect(content.querySelector(".kb-entry")).toBeNull();
    expect(content.querySelector(".kb-filter")).toBeNull();
  });
});
