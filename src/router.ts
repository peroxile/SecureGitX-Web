type Handler = (root: HTMLElement, params: RegExpMatchArray) => void;

interface Route {
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [];
let root: HTMLElement;

export function route(pattern: RegExp, handler: Handler): void {
  routes.push({ pattern, handler });
}

export function navigate(path: string): void {
  history.pushState({}, '', path);
  dispatch(path);
}

function dispatch(path: string): void {
  // Update active nav links
  document.querySelectorAll<HTMLElement>('[data-nav-path]').forEach(el => {
    const target = el.dataset.navPath ?? '';
    const active = path === target || (target !== '/' && path.startsWith(target));
    el.classList.toggle('nav__link--active', active);
  });

  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) {
      r.handler(root, m);
      window.scrollTo(0, 0);
      return;
    }
  }

  // 404
  root.innerHTML = `
    <div class="not-found">
      <div class="not-found__code">404</div>
      <div class="not-found__msg">Page not found.</div>
      <button class="btn-ghost" style="margin-top:1rem" onclick="history.back()">Go back</button>
    </div>`;
}

export function initRouter(rootEl: HTMLElement): void {
  root = rootEl;
  window.addEventListener('popstate', () => dispatch(location.pathname));

  // Intercept all internal link/button clicks with data-link attribute
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-link]');
    if (!target) return;
    const href = target.dataset.link;
    if (!href || href.startsWith('http') || href.startsWith('//')) return;
    e.preventDefault();
    navigate(href);
  });

  dispatch(location.pathname);
}
