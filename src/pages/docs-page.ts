import { getPageContent, getPageMeta, PAGES } from '../manifest';
import { renderPage } from '../renderer';
import { renderSidebar } from '../components/sidebar';
import { attachCodeHandlers } from '../components/code-handlers';
import { navigate } from '../router';

export function renderDocPage(root: HTMLElement, slug: string): void {
  const meta = getPageMeta(slug);
  const raw = getPageContent(slug);

  if (!meta || !raw) {
    root.innerHTML = `
      <div class="not-found">
        <div class="not-found__code">404</div>
        <div class="not-found__msg">Documentation page not found.</div>
        <button class="btn-ghost" style="margin-top:1rem" data-link="/docs">Back to docs</button>
      </div>`;
    return;
  }

  const { html, headings } = renderPage(raw);

  // Breadcrumb: Docs > Category > Title
  const breadcrumb = `
    <a data-link="/docs">Docs</a>
    <span style="margin:0 0.4rem;opacity:0.4">›</span>
    <span>${meta.categoryLabel}</span>
    <span style="margin:0 0.4rem;opacity:0.4">›</span>
    <span>${meta.title}</span>`;

  // GitHub source link (adjust org/repo as needed)
  const ghBase = 'https://github.com/peroxile/SecureGitX/blob/main';
  const sourceLink = `<a href="${ghBase}/${meta.file.slice(1)}" target="_blank" rel="noopener noreferrer">View source ↗</a>`;

  // Related pages
  const relatedLinks = meta.related
    .map(s => PAGES.find(p => p.slug === s))
    .filter(Boolean)
    .map(p => `<button class="related__link" data-slug="${p!.slug}">${p!.title}</button>`)
    .join('');

  // On-page heading nav (only if multiple headings exist)
  const onPageNav = headings.filter(h => h.level === 2).length > 2
    ? `<div style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;gap:0.5rem">
        ${headings
          .filter(h => h.level === 2)
          .map(h => `<a href="#${h.id}" style="font-family:var(--mono);font-size:0.65rem;color:var(--text-muted);letter-spacing:0.08em">${h.text}</a>`)
          .join('')}
       </div>`
    : '';

  root.innerHTML = `
    <div class="docs-layout">
      <aside class="docs-sidebar" id="docs-sidebar"></aside>
      <main class="docs-main">
        <div class="page-header">
          <div class="page-header__breadcrumb">${breadcrumb}</div>
          <h1 class="page-header__title">${meta.title}</h1>
          <div class="page-header__summary">${meta.summary}</div>
          <div class="page-header__source">${sourceLink}</div>
        </div>
        ${onPageNav}
        <div class="md-content">${html}</div>
        ${relatedLinks ? `<div class="related"><div class="related__label">Related</div><div class="related__links">${relatedLinks}</div></div>` : ''}
      </main>
    </div>`;

  renderSidebar(root.querySelector('#docs-sidebar')!, slug);
  attachCodeHandlers(root);

  // Related page navigation
  root.querySelectorAll<HTMLButtonElement>('[data-slug]').forEach(btn => {
    btn.addEventListener('click', () => navigate(`/${btn.dataset.slug}`));
  });
}
