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

  it("adds a feedback link to every entry using the configured template", () => {
    window.kbConfig = { feedbackUrl: "https://example.com/new?t={title}&b={body}", feedbackText: "纠错" };
    document.body.innerHTML = `<div id="content">${new MarkdownIt({ html: true }).render(md)}</div>`;
    const content = document.getElementById("content")!;
    enhanceEntries(content);
    const links = content.querySelectorAll<HTMLAnchorElement>("a.kb-feedback");
    expect(links.length).toBe(content.querySelectorAll("section.kb-entry").length);
    expect(links[0].textContent).toBe("纠错");
    expect(links[0].href).toContain("https://example.com/new?t=");
    expect(decodeURIComponent(links[0].href)).toContain("系安全带");
    window.kbConfig = undefined;
  });

  it("wraps a single-entry post (body starts with 成本标签) without a filter bar", () => {
    const single = [
      "**成本标签**：钱=0 · 时间=少 · 毅力=否 · 收益=大 · 口径=死亡率",
      "- 成本：不花钱。",
      "- 说人话：坐前排系上安全带，死亡概率大约降一半。",
      "- 证据等级：A",
      "- 来源：NHTSA",
      "",
      "---",
      "",
      "本条出自第 1 章。",
    ].join("\n");
    document.body.innerHTML = `<h1>系安全带，前排后排都系</h1><div id="content">${new MarkdownIt().render(single)}</div>`;
    const content = document.getElementById("content")!;
    enhanceEntries(content);
    const entry = content.querySelector<HTMLElement>("section.kb-entry.kb-entry-single")!;
    expect(entry).not.toBeNull();
    expect(entry.getAttribute("data-evidence")).toBe("A");
    expect(entry.querySelectorAll(".kb-tag").length).toBe(5);
    expect(content.querySelector(".kb-filter")).toBeNull();
    expect(decodeURIComponent(entry.querySelector<HTMLAnchorElement>("a.kb-feedback")!.href)).toContain("系安全带");
    // 出处段落保留在条目之外
    expect(content.textContent).toContain("本条出自第 1 章");
  });

  it("leaves ordinary articles untouched", () => {
    document.body.innerHTML = `<div id="content"><h2>普通标题</h2><p>普通段落</p></div>`;
    const content = document.getElementById("content")!;
    enhanceEntries(content);
    expect(content.querySelector(".kb-entry")).toBeNull();
    expect(content.querySelector(".kb-filter")).toBeNull();
  });
});
