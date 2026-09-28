/**
 * 知识库条目增强
 *
 * 面向「高性价比人生指南」这类结构化内容：文章正文里每个二级标题是一条建议，
 * 标题下面紧跟一行「**成本标签**：钱=0 · 时间=少 · 毅力=否 · 收益=大 · 口径=死亡率」
 * 和一个列表（成本 / 说人话 / 收益 / 证据等级 / 来源 / 备注）。
 *
 * 这里在浏览器端把这些纯文本升级成：
 *  - 成本标签 -> 彩色徽章
 *  - 证据等级 A/B/C -> 彩色等级块
 *  - 「说人话」 -> 高亮摘要
 *  - 每条建议包成 <section class="kb-entry">，带证据等级 data 属性
 *  - 正文顶部加一个筛选条：按证据等级 / 只看摘要
 *
 * 不依赖任何后端改动；普通文章没有这些结构时什么都不做。
 */

const LEVEL_CLASS: Record<string, string> = {
  "0": "kb-lv-none",
  无: "kb-lv-none",
  少: "kb-lv-low",
  中: "kb-lv-mid",
  多: "kb-lv-high",
  大: "kb-lv-high",
  小: "kb-lv-low",
  是: "kb-lv-mid",
  否: "kb-lv-none",
};

const TAG_LABEL: Record<string, string> = {
  钱: "钱",
  时间: "时间",
  毅力: "毅力",
  收益: "收益",
  口径: "口径",
};

function parseCostTags(text: string): Array<{ key: string; value: string }> {
  // 形如 "钱=0 · 时间=少 · 毅力=否 · 收益=大 · 口径=死亡率"
  return text
    .split(/[·,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [key, ...rest] = pair.split("=");
      return { key: key.trim(), value: rest.join("=").trim() };
    })
    .filter((t) => t.key && t.value);
}

function renderCostTags(tags: Array<{ key: string; value: string }>): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "kb-tags";
  for (const { key, value } of tags) {
    const chip = document.createElement("span");
    const level = key === "口径" ? "kb-lv-info" : LEVEL_CLASS[value] || "kb-lv-mid";
    // 收益越大越好，成本越少越好：收益用反向色
    const inverted = key === "收益" ? " kb-inverted" : "";
    chip.className = `kb-tag ${level}${inverted}`;
    chip.innerHTML = `<span class="kb-tag-k">${TAG_LABEL[key] ?? key}</span><span class="kb-tag-v">${value}</span>`;
    wrap.appendChild(chip);
  }
  return wrap;
}

function enhanceListItems(list: HTMLElement): string | undefined {
  let evidence: string | undefined;
  list.querySelectorAll(":scope > li").forEach((li) => {
    const text = li.textContent?.trim() ?? "";
    const m = text.match(/^(成本|说人话|收益|证据等级|来源|备注)[：:]\s*/);
    if (!m) return;
    const label = m[1];
    li.classList.add("kb-field", `kb-field-${fieldSlug(label)}`);

    // 把 "标签：" 前缀替换成一个可样式化的 span
    const first = li.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      const rest = first.textContent!.replace(m[0], "");
      const labelEl = document.createElement("span");
      labelEl.className = "kb-field-label";
      labelEl.textContent = label;
      li.replaceChild(document.createTextNode(rest), first);
      li.insertBefore(labelEl, li.firstChild);
    }

    if (label === "证据等级") {
      const grade = (text.replace(m[0], "").trim().charAt(0) || "").toUpperCase();
      if (["A", "B", "C"].includes(grade)) {
        evidence = grade;
        const badge = document.createElement("span");
        badge.className = `kb-evidence kb-evidence-${grade.toLowerCase()}`;
        badge.textContent = grade;
        badge.title = { A: "证据等级 A：随机试验 / 系统综述 / 官方法规", B: "证据等级 B：观察性研究或单项研究", C: "证据等级 C：推断、经验或弱证据" }[grade] ?? "";
        // 用徽章替换纯文本等级
        li.querySelectorAll(".kb-field-label").forEach((n) => n.remove());
        li.textContent = "";
        const labelEl = document.createElement("span");
        labelEl.className = "kb-field-label";
        labelEl.textContent = "证据等级";
        li.append(labelEl, badge);
      }
    }
  });
  return evidence;
}

function fieldSlug(label: string): string {
  return (
    { 成本: "cost", 说人话: "plain", 收益: "benefit", 证据等级: "evidence", 来源: "source", 备注: "note" }[label] ??
    "other"
  );
}

export function enhanceEntries(container: HTMLElement) {
  const headings = Array.from(container.querySelectorAll<HTMLElement>("h2"));
  if (!headings.length) return;

  let entryCount = 0;
  const entries: HTMLElement[] = [];

  for (const h2 of headings) {
    // 收集 h2 之后直到下一个 h2/h1/hr 的兄弟节点
    const nodes: Element[] = [];
    let sib = h2.nextElementSibling;
    while (sib && !/^H[12]$/.test(sib.tagName) && sib.tagName !== "HR") {
      nodes.push(sib);
      sib = sib.nextElementSibling;
    }

    // 识别成本标签段落
    const tagP = nodes.find(
      (n) => n.tagName === "P" && /^成本标签[：:]/.test(n.textContent?.trim() ?? "")
    ) as HTMLElement | undefined;
    const list = nodes.find((n) => n.tagName === "UL") as HTMLElement | undefined;
    if (!tagP && !list) continue; // 不是条目结构，跳过

    const section = document.createElement("section");
    section.className = "kb-entry";
    section.id = h2.id || `kb-entry-${++entryCount}`;
    h2.parentNode?.insertBefore(section, h2);
    section.appendChild(h2);
    h2.classList.add("kb-entry-title");
    nodes.forEach((n) => section.appendChild(n));

    if (tagP) {
      const raw = (tagP.textContent ?? "").replace(/^成本标签[：:]\s*/, "");
      const tags = parseCostTags(raw);
      if (tags.length) {
        const rendered = renderCostTags(tags);
        tagP.replaceWith(rendered);
        for (const t of tags) section.dataset[`tag${t.key}`] = t.value;
      }
    }

    if (list) {
      list.classList.add("kb-fields");
      const evidence = enhanceListItems(list);
      if (evidence) section.dataset.evidence = evidence;
    }
    entries.push(section);
  }

  if (entries.length) mountFilterBar(container, entries);
}

function mountFilterBar(container: HTMLElement, entries: HTMLElement[]) {
  const bar = document.createElement("div");
  bar.className = "kb-filter";
  const count = (g: string) => entries.filter((e) => e.dataset.evidence === g).length;
  bar.innerHTML = `
    <span class="kb-filter-label">共 ${entries.length} 条 · 证据等级</span>
    <button type="button" data-grade="all" class="kb-filter-btn is-active">全部</button>
    <button type="button" data-grade="A" class="kb-filter-btn">A <small>${count("A")}</small></button>
    <button type="button" data-grade="B" class="kb-filter-btn">B <small>${count("B")}</small></button>
    <button type="button" data-grade="C" class="kb-filter-btn">C <small>${count("C")}</small></button>
    <label class="kb-filter-toggle"><input type="checkbox" data-plain-only /> 只看「说人话」</label>
  `;
  container.insertBefore(bar, container.firstChild);

  bar.querySelectorAll<HTMLButtonElement>("[data-grade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = btn.dataset.grade!;
      bar.querySelectorAll(".kb-filter-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      entries.forEach((e) => {
        e.hidden = g !== "all" && e.dataset.evidence !== g;
      });
    });
  });
  bar.querySelector<HTMLInputElement>("[data-plain-only]")?.addEventListener("change", (ev) => {
    container.classList.toggle("kb-plain-only", (ev.target as HTMLInputElement).checked);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");
  if (content) enhanceEntries(content);
});
