type Handler = (root: HTMLElement, params: RegExpMatchArray) => void;

interface Route {
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [];
let root: HTMLElement | undefined;

export function route(pattern: RegExp, handler: Handler): void {
  routes.push({ pattern, handler });
}

export function navigate(nextPath: string): void {
  const path = normalizePath(nextPath);
  if (location.pathname !== path) {
    history.pushState({}, "", path);
  }
  dispatch(path);
}

function dispatch(rawPath: string): void {
  if (!root) return;

  const path = normalizePath(rawPath);

  // Update active nav links
  document.querySelectorAll<HTMLElement>("[data-nav-path]").forEach((el) => {
    const target = normalizePath(el.dataset.navPath ?? "");
    const active =
      path === target || (target !== "/" && path.startsWith(target + "/"));
    el.classList.toggle("nav__link--active", active);
  });

  for (const r of routes) {
    const match = path.match(r.pattern);
    if (match) {
      r.handler(root, match);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
  }

  root.innerHTML = `
    <div class="not-found">
      <div class="not-found__code">404</div>
      <div class="not-found__msg">Page not found.</div>
      <button class="btn-ghost" style="margin-top:1rem" data-link="/">Go back</button>
    </div>
  `;
}

export function initRouter(rootEl: HTMLElement): void {
  root = rootEl;

  window.addEventListener("popstate", () => {
    dispatch(location.pathname);
  });

  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-link]"
    );
    if (!target) return;

    const href = target.dataset.link?.trim();
    if (!href || href.startsWith("http") || href.startsWith("//")) return;

    e.preventDefault();
    navigate(href);
  });

  dispatch(location.pathname);
}

function normalizePath(path: string): string {
  if (!path) return "/";
  const withoutQuery = path.split("?")[0].split("#")[0];
  if (withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "");
}
