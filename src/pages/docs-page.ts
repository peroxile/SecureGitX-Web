import { getPageContent, getPageMeta, PAGES, sourceUrl } from "../manifest";
import { renderPage } from "../renderer";
import { renderSidebar } from "../components/sidebar";
import { attachCodeHandlers } from "../components/code-handlers";
import { navigate } from "../router";

function loadingLayout(): string {
  return `
    <div class="docs-layout">
      <aside class="docs-sidebar" id="docs-sidebar"></aside>
      <main class="docs-main">
        <div class="sk-line" style="width:35%;height:0.7rem;margin-bottom:0.7rem"></div>
        <div class="sk-line" style="width:45%;height:1.4rem;margin-bottom:0.5rem"></div>
        <div class="sk-line" style="width:70%;margin-bottom:2rem"></div>
        <div class="sk-line" style="width:90%"></div>
        <div class="sk-line" style="width:82%"></div>
        <div class="sk-line" style="width:87%;margin-bottom:1.2rem"></div>
        <div class="sk-line" style="width:100%;height:6rem"></div>
      </main>
    </div>`;
}

function notFound(msg: string): string {
  return `
    <div class="not-found">
      <div class="not-found__code">404</div>
      <div class="not-found__msg">${msg}</div>
      <button class="btn-ghost" style="margin-top:1rem" data-link="/docs">Back to docs</button>
    </div>`;
}

function errorState(): string {
  return `
    <div class="not-found">
      <div class="not-found__code" style="font-size:2.5rem">!</div>
      <div class="not-found__msg">Failed to load page. Check your connection and try again.</div>
      <button class="btn-ghost" style="margin-top:1rem" onclick="location.reload()">Retry</button>
    </div>`;
}

export function renderDocPage(root: HTMLElement, slug: string): void {
  const meta = getPageMeta(slug);

  if (!meta) {
    root.innerHTML = notFound("Documentation page not found.");
    return;
  }

  // Render layout shell + sidebar immediately
  root.innerHTML = loadingLayout();
  renderSidebar(root.querySelector("#docs-sidebar")!, slug);

  // Fetch and render content
  getPageContent(slug).then((raw) => {
    if (!raw) {
      root.querySelector(".docs-main")!.innerHTML = errorState();
      return;
    }

    const { html, headings } = renderPage(raw);

    const breadcrumb = `
      <button class="page-header__breadcrumb-link" data-link="/docs">Docs</button>
      <span class="bc:-sep">›</span>
      <span>${meta.categoryLabel}</span>
      <span class="bc:-sep">›</span>
      <span>${meta.title}</span>`;

    const onPageNav =
      headings.filter((h) => h.level === 2).length > 2
        ? `<div class="on-page-nav">
          ${headings
            .filter((h) => h.level === 2)
            .map(
              (h) =>
                `<a class="on-page-nav__link" href="#${h.id}">${h.text}</a>`
            )
            .join("")}
         </div>`
        : "";

    const relatedLinks = meta.related
      .map((s) => PAGES.find((p) => p.slug === s))
      .filter((p): p is (typeof PAGES)[0] => !!p)
      .map(
        (p) =>
          `<button class="related__link" data-slug="${p.slug}">${p.title}</button>`
      )
      .join("");

    root.querySelector(".docs-main")!.innerHTML = `
      <div class="page-header">
        <div class="page-header__breadcrumb">${breadcrumb}</div>
        <h1 class="page-header__title">${meta.title}</h1>
        <div class="page-header__summary">${meta.summary}</div>
        <div class="page-header__source">
          <a href="${sourceUrl(
            meta.file
          )}" target="_blank" rel="noopener noreferrer">View source on GitHub ↗</a>
        </div>
      </div>
      ${onPageNav}
      <div class="md-content">${html}</div>
      ${
        relatedLinks
          ? `
        <div class="related">
          <div class="related__label">Related</div>
          <div class="related__links">${relatedLinks}</div>
        </div>`
          : ""
      }`;

    attachCodeHandlers(root);

    root.querySelectorAll<HTMLButtonElement>("[data-slug]").forEach((btn) => {
      btn.addEventListener("click", () => navigate(`/${btn.dataset.slug}`));
    });
  });
}
