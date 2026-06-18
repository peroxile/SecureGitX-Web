import { Marked, type Tokens } from "marked";
import DOMPurify from "dompurify";

//  Types 

export interface FrontMatter {
  title?: string;
  category?: string;
  order?: number;
  summary?: string;
  related?: string;
}

export interface ParsedPage {
  meta: FrontMatter;
  html: string;
  headings: Heading[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

// Front matter 

const FM_RE = /^---\n([\s\S]*?)\n---\n?/;

export function parseFrontMatter(raw: string): {
  meta: FrontMatter;
  body: string;
} {
  const m = raw.match(FM_RE);
  if (!m) return { meta: {}, body: raw };
  const meta: FrontMatter = {};
  for (const line of m[1].split("\n")) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const val = line
      .slice(sep + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key === "order") meta.order = Number(val);
    else (meta as Record<string, unknown>)[key] = val;
  }
  return { meta, body: raw.slice(m[0].length) };
}

// Section extractor

export function extractSection(markdown: string, headingText: string): string {
  const lines = markdown.split("\n");
  let depth = 0;
  let capturing = false;
  const out: string[] = [];
  for (const line of lines) {
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      if (capturing && hm[1].length <= depth) break;
      if (hm[2].trim().toLowerCase() === headingText.toLowerCase()) {
        capturing = true;
        depth = hm[1].length;
        continue;
      }
    }
    if (capturing) out.push(line);
  }
  return out.join("\n").trim();
}

// Helpers

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

//  Marked instance factory
// New Marked instance per parse so heading collection is isolated.

function makeMarked(headings: Heading[]): Marked {
  return new Marked({
    renderer: {
      // h1 is rendered in page header — suppress it from body
      heading({ text, depth }: Tokens.Heading): string {
        if (depth === 1) return "";
        const id = slugify(text);
        headings.push({ id, text, level: depth });
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },

      code({ text, lang }: Tokens.Code): string {
        const l = lang ?? "";
        const lines = text.split("\n").length;
        const isLong = lines > 18;
        const escaped = escHtml(text);
        // Store escaped code in data attribute for copy handler
        const dataCode = escaped.replace(/'/g, "&#39;");
        return [
          `<div class="code-block${isLong ? " code-block--collapsed" : ""}">`,
          `  <div class="code-block__header">`,
          `    <span class="code-block__lang">${l}</span>`,
          `    <button class="code-block__copy" data-code='${dataCode}'>Copy</button>`,
          `  </div>`,
          `  <pre><code class="language-${l}">${escaped}</code></pre>`,
          isLong
            ? `  <button class="code-block__expand">Show all ${lines} lines ↓</button>`
            : "",
          `</div>`,
        ]
          .filter(Boolean)
          .join("\n");
      },

      table(token: Tokens.Table): string {
        const thead = token.header.map((c) => `<th>${c.text}</th>`).join("");
        const tbody = token.rows
          .map(
            (row) => `<tr>${row.map((c) => `<td>${c.text}</td>`).join("")}</tr>`
          )
          .join("");
        return `<div class="table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      },
    },
  });
}

//  Sanitize 

const PURIFY_OPTS: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "ul",
    "ol",
    "li",
    "a",
    "code",
    "pre",
    "strong",
    "em",
    "blockquote",
    "table",
    "img",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
    "hr",
    "br",
    "button",
  ],
  ALLOWED_ATTR: ["id", "href", "class", "data-code", "target", "rel"],
};

// Public API

//  Render arbitrary markdown (no front matter).
export function renderMarkdown(markdown: string): string {
  const headings: Heading[] = [];
  const inst = makeMarked(headings);
  const dirty = inst.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(dirty, PURIFY_OPTS);
}

// Parse front matter + render full page.
export function renderPage(raw: string): ParsedPage {
  const { meta, body } = parseFrontMatter(raw);
  const headings: Heading[] = [];
  const inst = makeMarked(headings);
  const dirty = inst.parse(body, { async: false }) as string;
  const html = DOMPurify.sanitize(dirty, PURIFY_OPTS);
  return { meta, html, headings };
}
