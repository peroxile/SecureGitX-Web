export interface PageMeta {
  slug: string;
  title: string;
  category: "cli" | "defaults" | "develop";
  categoryLabel: string;
  order: number;
  summary: string;
  // Path within the repo: /docs/cli/scan.md
  file: string;
  related: string[];
}

const GITHUB_RAW = "https://raw.githubusercontent.com/peroxile/SecureGitX/main";

export const README_URL = `${GITHUB_RAW}/README.md`;

export const PAGES: PageMeta[] = [
  {
    slug: "docs/cli/scan",
    title: "scan",
    category: "cli",
    categoryLabel: "CLI",
    order: 1,
    summary:
      "Scan staged or tracked files for secrets, sensitive filenames, and high-entropy tokens.",
    file: "/docs/cli/scan.md",
    related: ["docs/cli/hook", "docs/cli/init"],
  },
  {
    slug: "docs/cli/hook",
    title: "hook",
    category: "cli",
    categoryLabel: "CLI",
    order: 2,
    summary: "Install, uninstall, and inspect the pre-commit hook.",
    file: "/docs/cli/hook.md",
    related: ["docs/cli/scan", "docs/develop/architecture"],
  },
  {
    slug: "docs/cli/init",
    title: "init",
    category: "cli",
    categoryLabel: "CLI",
    order: 3,
    summary:
      "Bootstrap SecureGitX in a repository — creates config and installs the hook.",
    file: "/docs/cli/init.md",
    related: ["docs/cli/hook", "docs/cli/scan"],
  },
  {
    slug: "docs/cli/rules",
    title: "rules",
    category: "cli",
    categoryLabel: "CLI",
    order: 4,
    summary: "List, validate, update, and roll back the detection rules.",
    file: "/docs/cli/rules.md",
    related: ["docs/default/rules-format", "docs/cli/scan"],
  },
  {
    slug: "docs/cli/daemon",
    title: "daemon",
    category: "cli",
    categoryLabel: "CLI",
    order: 5,
    summary: "Optional background watcher that queues .gitignore suggestions.",
    file: "/docs/cli/daemon.md",
    related: ["docs/cli/init", "docs/develop/architecture"],
  },
  {
    slug: "docs/cli/config",
    title: "config",
    category: "cli",
    categoryLabel: "CLI",
    order: 6,
    summary:
      "Configure SecureGitX via .securegitx.toml and environment variable overrides.",
    file: "/docs/cli/config.md",
    related: ["docs/cli/init", "docs/cli/scan"],
  },
  {
    slug: "docs/cli/directcmt",
    title: "direct commit",
    category: "cli",
    categoryLabel: "CLI",
    order: 7,
    summary: "Scan staged changes and commit in one step if clean.",
    file: "/docs/cli/directcmt.md",
    related: ["docs/cli/scan", "docs/cli/hook"],
  },
  {
    slug: "docs/default/rules-format",
    title: "rules format",
    category: "defaults",
    categoryLabel: "Defaults",
    order: 1,
    summary:
      "Schema reference for rules.json — the detection rule definitions.",
    file: "/docs/default/rules-format.md",
    related: ["docs/cli/rules", "docs/develop/architecture"],
  },
  {
    slug: "docs/develop/architecture",
    title: "architecture",
    category: "develop",
    categoryLabel: "Develop",
    order: 1,
    summary: "Module layout, enforcement model, and design invariants.",
    file: "/docs/develop/architecture.md",
    related: ["docs/develop/development", "docs/develop/exitcodes"],
  },
  {
    slug: "docs/develop/development",
    title: "development",
    category: "develop",
    categoryLabel: "Develop",
    order: 2,
    summary: "Setting up a local dev environment and running tests.",
    file: "/docs/develop/development.md",
    related: ["docs/develop/architecture", "docs/default/rules-format"],
  },
  {
    slug: "docs/develop/exitcodes",
    title: "exit codes",
    category: "develop",
    categoryLabel: "Develop",
    order: 3,
    summary: "Complete exit code reference for all commands.",
    file: "/docs/develop/exitcodes.md",
    related: ["docs/cli/scan", "docs/cli/hook"],
  },
];

// Simple in-memory cache — avoids re-fetching on SPA navigation
const _cache = new Map<string, string>();

async function fetchRaw(url: string): Promise<string | null> {
  if (_cache.has(url)) return _cache.get(url)!;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    _cache.set(url, text);
    return text;
  } catch {
    return null;
  }
}

export async function getPageContent(slug: string): Promise<string | null> {
  const meta = PAGES.find((p) => p.slug === slug);
  if (!meta) return null;
  return fetchRaw(`${GITHUB_RAW}${meta.file}`);
}

export async function getReadme(): Promise<string | null> {
  return fetchRaw(README_URL);
}

export function getPageMeta(slug: string): PageMeta | undefined {
  return PAGES.find((p) => p.slug === slug);
}

export function getPagesByCategory(cat: PageMeta["category"]): PageMeta[] {
  return PAGES.filter((p) => p.category === cat).sort(
    (a, b) => a.order - b.order
  );
}

export const CATEGORIES: { key: PageMeta["category"]; label: string }[] = [
  { key: "cli", label: "CLI" },
  { key: "defaults", label: "Defaults" },
  { key: "develop", label: "Develop" },
];

// GitHub source URL for "View source" link on doc pages
export function sourceUrl(file: string): string {
  return `https://github.com/peroxile/SecureGitX/blob/main${file}`;
}
