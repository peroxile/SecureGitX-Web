import { CATEGORIES, getPagesByCategory } from '../manifest';
import { navigate } from '../router';
import { renderSidebar } from '../components/sidebar';

export function renderDocsIndex(root: HTMLElement): void {
  let groupsHtml = '';

  for (const cat of CATEGORIES) {
    const pages = getPagesByCategory(cat.key);
    const cards = pages
      .map(p => `
        <div class="docs-card" data-slug="${p.slug}">
          <div class="docs-card__title">${p.title}</div>
          <div class="docs-card__summary">${p.summary}</div>
        </div>`)
      .join('');

    groupsHtml += `
      <div class="docs-group">
        <div class="docs-group__label">${cat.label}</div>
        <div class="docs-grid">${cards}</div>
      </div>`;
  }

  root.innerHTML = `
    <div class="docs-layout">
      <aside class="docs-sidebar" id="docs-sidebar"></aside>
      <div class="docs-index">
        <div class="page-header">
          <div class="page-header__title">Documentation</div>
          <div class="page-header__summary">
            Command reference, configuration, architecture, and development guides.
          </div>
        </div>
        ${groupsHtml}
      </div>
    </div>`;

  renderSidebar(root.querySelector('#docs-sidebar')!, '');

  root.querySelectorAll<HTMLElement>('[data-slug]').forEach(card => {
    card.addEventListener('click', () => navigate(`/${card.dataset.slug}`));
  });
}
