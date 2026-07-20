export interface PageMeta {
  slug: string; // internal id
  route: string; // public URL
  title: string;
  category: "cli" | "defaults" | "develop";
  categoryLabel: string;
  order: number;
  summary: string;
  file: string;
  related: string[]; // internal slugs
}

const GITHUB_RAW = "https://raw.githubusercontent.com/peroxile/SecureGitX/main";
export const README_URL = `${GITHUB_RAW}/README.md`;

export const PAGES: PageMeta[] = [
  {
    slug: "scan",
    route: "/docs/cli/scan",
    title: "scan",
    category: "cli",
    categoryLabel: "CLI",
    order: 1,
    summary:
      "Scan staged or tracked files for secrets, sensitive filenames, and high-entropy tokens.",
    file: "/docs/cli/scan.md",
    related: ["hook", "init"],
  },
  {
    slug: "hook",
    route: "/docs/cli/hook",
    title: "hook",
    category: "cli",
    categoryLabel: "CLI",
    order: 2,
    summary: "Install, uninstall, and inspect the pre-commit hook.",
    file: "/docs/cli/hook.md",
    related: ["scan", "architecture"],
  },
  {
    slug: "init",
    route: "/docs/cli/init",
    title: "init",
    category: "cli",
    categoryLabel: "CLI",
    order: 3,
    summary:
      "Bootstrap SecureGitX in a repository — creates config and installs the hook.",
    file: "/docs/cli/init.md",
    related: ["hook", "scan"],
  },
  {
    slug: "rules",
    route: "/docs/cli/rules",
    title: "rules",
    category: "cli",
    categoryLabel: "CLI",
    order: 4,
    summary: "List, validate, update, and roll back the detection rules.",
    file: "/docs/cli/rules.md",
    related: ["rules-format", "scan"],
  },
  {
    slug: "daemon",
    route: "/docs/cli/daemon",
    title: "daemon",
    category: "cli",
    categoryLabel: "CLI",
    order: 5,
    summary: "Optional background watcher that queues .gitignore suggestions.",
    file: "/docs/cli/daemon.md",
    related: ["init", "architecture"],
  },
  {
    slug: "config",
    route: "/docs/cli/config",
    title: "config",
    category: "cli",
    categoryLabel: "CLI",
    order: 6,
    summary:
      "Configure SecureGitX via .securegitx.toml and environment variable overrides.",
    file: "/docs/cli/config.md",
    related: ["init", "scan"],
  },
  {
    slug: "direct-commit",
    route: "/docs/cli/directcmt",
    title: "direct commit",
    category: "cli",
    categoryLabel: "CLI",
    order: 7,
    summary: "Scan staged changes and commit in one step if clean.",
    file: "/docs/cli/directcmt.md",
    related: ["scan", "hook"],
  },
  {
    slug: "rules-format",
    route: "/docs/default/rules-format",
    title: "rules format",
    category: "defaults",
    categoryLabel: "Defaults",
    order: 1,
    summary:
      "Schema reference for rules.json — the detection rule definitions.",
    file: "/docs/default/rules-format.md",
    related: ["rules", "architecture"],
  },
  {
    slug: "architecture",
    route: "/docs/develop/architecture",
    title: "architecture",
    category: "develop",
    categoryLabel: "Develop",
    order: 1,
    summary: "Module layout, enforcement model, and design invariants.",
    file: "/docs/develop/architecture.md",
    related: ["development", "exit-codes"],
  },
  {
    slug: "development",
    route: "/docs/develop/development",
    title: "development",
    category: "develop",
    categoryLabel: "Develop",
    order: 2,
    summary: "Setting up a local dev environment and running tests.",
    file: "/docs/develop/development.md",
    related: ["architecture", "rules-format"],
  },
  {
    slug: "exit-codes",
    route: "/docs/develop/exitcodes",
    title: "exit codes",
    category: "develop",
    categoryLabel: "Develop",
    order: 3,
    summary: "Complete exit code reference for all commands.",
    file: "/docs/develop/exitcodes.md",
    related: ["scan", "hook"],
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

function normalizePath(input: string): string {
  if (!input) return "/";
  const clean = input.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean || "/";
}

function normalizeRoute(input: string): string {
  const path = normalizePath(input);
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeSlug(input: string): string {
  const cleaned = normalizePath(input).replace(/^\/+/, "");
  return cleaned;
}

function findPage(input: string): PageMeta | undefined {
  const route = normalizeRoute(input);
  const slug = normalizeSlug(input);

  return PAGES.find((p) => p.route === route || p.slug === slug);
}

export function getPageMeta(slugOrRoute: string): PageMeta | undefined {
  return findPage(slugOrRoute);
}

export function getPageByRoute(route: string): PageMeta | undefined {
  return findPage(route);
}

export async function getPageContent(
  slugOrRoute: string
): Promise<string | null> {
  const meta = findPage(slugOrRoute);
  if (!meta) return null;
  return fetchRaw(`${GITHUB_RAW}${meta.file}`);
}

export async function getPageContentByRoute(
  route: string
): Promise<string | null> {
  return getPageContent(route);
}

export async function getReadme(): Promise<string | null> {
  return fetchRaw(README_URL);
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
