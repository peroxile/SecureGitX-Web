import { getPageContent, getPageMeta, PAGES, sourceUrl } from "../manifest";
import { renderPage } from "../renderer";
import { renderSidebar } from "../components/sidebar";
import { attachCodeHandlers } from "../components/code-handlers";
import { navigate } from "../router";

export async function renderDocPage(
  root: HTMLElement,
  slugOrRoute: string
): Promise<void> {
  const meta = getPageMeta(slugOrRoute);

  if (!meta) {
    root.innerHTML = `
      <div class="not-found">
        <div class="not-found__code">404</div>
        <div class="not-found__msg">Documentation page not found.</div>
        <button class="btn-ghost" style="margin-top:1rem" data-link="/docs">Back to docs</button>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="docs-layout">
      <aside class="docs-sidebar" id="docs-sidebar"></aside>
      <main class="docs-main">
        <div class="sk-line" style="width:60%"></div>
        <div class="sk-line" style="width:90%"></div>
        <div class="sk-line" style="width:80%"></div>
      </main>
    </div>`;

  const sidebar = root.querySelector<HTMLElement>("#docs-sidebar");
  const main = root.querySelector<HTMLElement>(".docs-main");

  if (!sidebar || !main) return;

  renderSidebar(sidebar, meta.route);

  const raw = await getPageContent(meta.route);
  if (!raw) {
    main.innerHTML = `
      <div class="not-found">
        <div class="not-found__code">404</div>
        <div class="not-found__msg">Documentation page not found.</div>
        <button class="btn-ghost" style="margin-top:1rem" data-link="/docs">Back to docs</button>
      </div>`;
    return;
  }

  const { html, headings } = renderPage(raw);

  const h2s = headings.filter((h) => h.level === 2);
  const onPageNav =
    h2s.length > 2
      ? `<div style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;gap:0.5rem">
          ${h2s
            .map(
              (h) =>
                `<a href="#${h.id}" style="font-family:var(--mono);font-size:0.65rem;color:var(--text-muted);letter-spacing:0.08em">${h.text}</a>`
            )
            .join("")}
        </div>`
      : "";

  const relatedLinks = meta.related
    .map((slug) => PAGES.find((p) => p.slug === slug))
    .filter(Boolean)
    .map(
      (p) =>
        `<button class="related__link" type="button" data-link="${p!.route}">${
          p!.title
        }</button>`
    )
    .join("");

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header__breadcrumb">
        <a data-link="/docs">Docs</a>
        <span style="margin:0 0.4rem;opacity:0.4">›</span>
        <span>${meta.categoryLabel}</span>
        <span style="margin:0 0.4rem;opacity:0.4">›</span>
        <span>${meta.title}</span>
      </div>
      <h1 class="page-header__title">${meta.title}</h1>
      <div class="page-header__summary">${meta.summary}</div>
      <div class="page-header__source">
        <a href="${sourceUrl(
          meta.file
        )}" target="_blank" rel="noopener noreferrer">View source ↗</a>
      </div>
    </div>

    ${onPageNav}
    <div class="md-content">${html}</div>
    ${
      relatedLinks
        ? `<div class="related">
             <div class="related__label">Related</div>
             <div class="related__links">${relatedLinks}</div>
           </div>`
        : ""
    }
  `;

  attachCodeHandlers(root);

  root.querySelectorAll<HTMLElement>("[data-link]").forEach((el) => {
    el.addEventListener("click", () => {
      const href = el.dataset.link || "/docs";
      navigate(href);
    });
  });
}
